import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { CancelOrderResponseDto } from './dto/cancel-order-response.dto';
import { OrderStatus } from '../../common/enums/index';
import { DistanceCalculator } from '../../common/utils/distance-calculator.util';
import {
  ConflictException,
  ValidationException,
  ErrorCodes,
  ErrorMessages,
} from '../../common/exceptions/custom-exceptions';
import { ConfigService } from '@nestjs/config';

/**
 * Order service
 * Handles order lifecycle: creation, tracking, cancellation
 * Implements business rules for delivery operations
 */
@Injectable()
export class OrderService {
  private readonly serviceAreaRadiusKm: number;
  private readonly baseCostPerKm = 2.5; // Cost calculation factor
  private readonly baseWeightCost = 5; // Base cost for weight

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: ConfigService,
  ) {
    this.serviceAreaRadiusKm = this.configService.get<number>('service.areaRadiusKm') ?? 50;
  }

  /**
   * Create a new order
   * Validates service area, calculates cost and ETA
   */
  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    // Calculate distance between origin and destination
    const distance = DistanceCalculator.calculateDistance(
      createOrderDto.origin.latitude,
      createOrderDto.origin.longitude,
      createOrderDto.destination.latitude,
      createOrderDto.destination.longitude,
    );

    // Validate service area (basic check - origin within radius of some central point)
    // In production, this would check against a proper service area polygon
    if (distance > this.serviceAreaRadiusKm) {
      throw new ValidationException(ErrorCodes.ORDER_003, ErrorMessages[ErrorCodes.ORDER_003]);
    }

    // Calculate cost based on distance and weight
    const cost = this.calculateCost(distance, createOrderDto.packageDetails.weight);

    // Calculate estimated times
    const now = new Date();
    const estimatedPickupTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
    const estimatedDeliveryTime = DistanceCalculator.calculateETA(distance);

    // Create order entity
    const order = this.orderRepository.create({
      userId,
      status: OrderStatus.PENDING,
      origin: {
        latitude: createOrderDto.origin.latitude,
        longitude: createOrderDto.origin.longitude,
        altitude: createOrderDto.origin.altitude ?? null,
        address: createOrderDto.origin.address ?? null,
        timestamp: createOrderDto.origin.timestamp || new Date(),
      },
      destination: {
        latitude: createOrderDto.destination.latitude,
        longitude: createOrderDto.destination.longitude,
        altitude: createOrderDto.destination.altitude ?? null,
        address: createOrderDto.destination.address ?? null,
        timestamp: createOrderDto.destination.timestamp || new Date(),
      },
      packageDetails: createOrderDto.packageDetails,
      cost,
      estimatedPickupTime,
      estimatedDeliveryTime,
      scheduledPickupTime: createOrderDto.scheduledPickupTime
        ? new Date(createOrderDto.scheduledPickupTime)
        : undefined,
    });

    // Save to database
    const savedOrder = await this.orderRepository.save(order);

    // Return response DTO
    return this.mapToResponseDto(savedOrder);
  }

  /**
   * Get order by ID
   * Returns detailed order information including timeline
   */
  async getOrderById(orderId: string, userId?: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['assignedDrone'],
    });

    if (!order) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.ORDER_001]);
    }

    // If userId provided (end user request), verify ownership
    if (userId && order.userId !== userId) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.ORDER_001]);
    }

    return this.mapToResponseDto(order);
  }

  /**
   * Cancel an order
   * Only allowed if order is pending or assigned (not picked up)
   */
  async cancelOrder(orderId: string, userId: string): Promise<CancelOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.ORDER_001]);
    }

    // Check if cancellation is allowed
    if (![OrderStatus.PENDING, OrderStatus.ASSIGNED].includes(order.status)) {
      throw new ConflictException(ErrorCodes.ORDER_002, ErrorMessages[ErrorCodes.ORDER_002]);
    }

    // Calculate refund based on status
    const refundAmount = this.calculateRefund(order);

    // Update order status
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    await this.orderRepository.save(order);

    // In a real system, would notify assigned drone here
    // await this.notifyDroneOfCancellation(order.assignedDroneId);

    return {
      orderId: order.id,
      status: order.status,
      refundAmount,
      cancelledAt: order.cancelledAt,
    };
  }

  /**
   * Update order status
   * Used by drone operations to update order lifecycle
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    options?: {
      actualPickupTime?: Date;
      actualDeliveryTime?: Date;
      failureReason?: string;
    },
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.ORDER_001]);
    }

    order.status = status;

    if (options?.actualPickupTime) {
      order.actualPickupTime = options.actualPickupTime;
    }

    if (options?.actualDeliveryTime) {
      order.actualDeliveryTime = options.actualDeliveryTime;
    }

    if (options?.failureReason) {
      order.failureReason = options.failureReason;
    }

    return this.orderRepository.save(order);
  }

  /**
   * Assign drone to order
   */
  async assignDrone(orderId: string, droneId: string): Promise<void> {
    await this.orderRepository.update(
      { id: orderId },
      {
        assignedDroneId: droneId,
        status: OrderStatus.ASSIGNED,
      },
    );
  }

  /**
   * Calculate delivery cost based on distance and weight
   */
  private calculateCost(distanceKm: number, weightKg: number): number {
    const distanceCost = distanceKm * this.baseCostPerKm;
    const weightCost = weightKg * this.baseWeightCost;
    const totalCost = distanceCost + weightCost;

    // Round to 2 decimal places
    return Math.round(totalCost * 100) / 100;
  }

  /**
   * Calculate refund amount based on order status
   * 100% if pending, 50% if assigned, 0% if picked up
   */
  private calculateRefund(order: Order): number {
    if (order.status === OrderStatus.PENDING) {
      return order.cost; // 100% refund
    } else if (order.status === OrderStatus.ASSIGNED) {
      return order.cost * 0.5; // 50% refund
    }
    return 0; // No refund if picked up
  }

  /**
   * Map order entity to response DTO
   */
  private mapToResponseDto(order: Order): OrderResponseDto {
    const response: OrderResponseDto = {
      orderId: order.id,
      status: order.status,
      origin: order.origin,
      destination: order.destination,
      packageDetails: order.packageDetails,
      estimatedPickupTime: order.estimatedPickupTime,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      cost: order.cost,
    };

    // Include drone info if assigned
    if (order.assignedDrone) {
      response.assignedDrone = {
        droneId: order.assignedDrone.id,
        model: order.assignedDrone.model,
      };

      // Include current location if in transit
      if ([OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(order.status)) {
        response.currentLocation = order.assignedDrone.currentLocation;
      }
    }

    // Build timeline (simplified version)
    response.timeline = [
      {
        status: OrderStatus.PENDING,
        timestamp: order.createdAt,
      },
    ];

    if (order.actualPickupTime) {
      response.timeline.push({
        status: OrderStatus.PICKED_UP,
        timestamp: order.actualPickupTime,
      });
    }

    if (order.actualDeliveryTime) {
      response.timeline.push({
        status: OrderStatus.DELIVERED,
        timestamp: order.actualDeliveryTime,
      });
    }

    return response;
  }
}
