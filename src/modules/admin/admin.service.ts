import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { OrderModification } from '../order/entities/order-modification.entity';
import { Drone } from '../drone/entities/drone.entity';
import { BreakageEvent } from '../drone/entities/breakage-event.entity';
import {
  GetOrdersQueryDto,
  OrdersBulkResponseDto,
  ModifyOrderDto,
  ModifyOrderResponseDto,
  GetDronesQueryDto,
  DronesFleetResponseDto,
  UpdateDroneStatusDto,
  UpdateDroneStatusResponseDto,
  CreateDroneDto,
  UpdateDroneDto,
  DroneResponseDto,
} from './dto/index';
import { OrderStatus, DroneStatus } from '../../common/enums/index';
import { DistanceCalculator } from '../../common/utils/distance-calculator.util';
import {
  ConflictException,
  ErrorCodes,
  ErrorMessages,
} from '../../common/exceptions/custom-exceptions';

/**
 * Admin service
 * Handles administrative operations for monitoring and managing the delivery system
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderModification)
    private orderModificationRepository: Repository<OrderModification>,
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
    @InjectRepository(BreakageEvent)
    private breakageRepository: Repository<BreakageEvent>,
  ) {}

  /**
   * Get orders with filtering and pagination
   * Supports filtering by status, date range, drone ID, and user ID
   */
  async getOrders(query: GetOrdersQueryDto): Promise<OrdersBulkResponseDto> {
    const { status, startDate, endDate, droneId, userId, limit, offset } = query;

    // Build where clause dynamically
    const where: FindOptionsWhere<Order> = {};

    if (status) {
      where.status = status;
    }

    if (droneId) {
      where.assignedDroneId = droneId;
    }

    if (userId) {
      where.userId = userId;
    }

    // Date range filter
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = Between(new Date(startDate), new Date());
    }

    // Execute query with pagination
    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['assignedDrone'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    // Map to response DTO
    const orderDtos = orders.map((order) => ({
      orderId: order.id,
      userId: order.userId,
      status: order.status,
      origin: order.origin,
      destination: order.destination,
      assignedDrone: order.assignedDroneId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return {
      orders: orderDtos,
      total,
      limit: limit ?? 50,
      offset: offset ?? 0,
    };
  }

  /**
   * Modify order route
   * Allows admins to change origin or destination
   * Records modification history for audit trail
   */
  async modifyOrder(
    orderId: string,
    modifyDto: ModifyOrderDto,
    adminName: string,
  ): Promise<ModifyOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.ORDER_001]);
    }

    // Cannot modify delivered or cancelled orders
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new ConflictException(
        ErrorCodes.ORDER_002,
        'Cannot modify completed or cancelled orders',
      );
    }

    // Store previous values for audit
    const previousOrigin = order.origin;
    const previousDestination = order.destination;

    // Create modification record
    const modification = this.orderModificationRepository.create({
      orderId: order.id,
      modifiedBy: adminName,
      reason: modifyDto.reason,
      previousOrigin,
      previousDestination,
      newOrigin: modifyDto.origin || order.origin,
      newDestination: modifyDto.destination || order.destination,
    });

    await this.orderModificationRepository.save(modification);

    // Update order
    if (modifyDto.origin) {
      order.origin = {
        latitude: modifyDto.origin.latitude,
        longitude: modifyDto.origin.longitude,
        altitude: modifyDto.origin.altitude ?? null,
        address: modifyDto.origin.address ?? null,
        timestamp: modifyDto.origin.timestamp || new Date(),
      };
    }

    if (modifyDto.destination) {
      order.destination = {
        latitude: modifyDto.destination.latitude,
        longitude: modifyDto.destination.longitude,
        altitude: modifyDto.destination.altitude ?? null,
        address: modifyDto.destination.address ?? null,
        timestamp: modifyDto.destination.timestamp || new Date(),
      };
    }

    // Recalculate ETA if in transit
    if ([OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(order.status)) {
      const distance = DistanceCalculator.calculateDistance(
        order.origin.latitude,
        order.origin.longitude,
        order.destination.latitude,
        order.destination.longitude,
      );
      order.estimatedDeliveryTime = DistanceCalculator.calculateETA(distance);
    }

    await this.orderRepository.save(order);

    // In production, would notify assigned drone of route change here
    // await this.notificationService.notifyDroneOfRouteChange(order.assignedDroneId, order);

    return {
      orderId: order.id,
      status: order.status,
      origin: order.origin,
      destination: order.destination,
      newEta: order.estimatedDeliveryTime,
      modifiedAt: modification.createdAt,
      modifiedBy: adminName,
    };
  }

  /**
   * Get drone fleet status
   * Returns all drones with optional filtering and fleet statistics
   */
  async getDroneFleet(query: GetDronesQueryDto): Promise<DronesFleetResponseDto> {
    const { status, limit, offset } = query;

    // Build where clause
    const where: FindOptionsWhere<Drone> = {};
    if (status) {
      where.status = status;
    }

    // Execute query
    const [drones, total] = await this.droneRepository.findAndCount({
      where,
      relations: ['currentOrder'],
      take: limit,
      skip: offset,
      order: { lastHeartbeat: 'DESC' },
    });

    // Map to response DTO
    const droneDtos = drones.map((drone) => ({
      droneId: drone.id,
      model: drone.model,
      status: drone.status,
      currentLocation: drone.currentLocation,
      batteryLevel: drone.batteryLevel,
      currentOrder: drone.currentOrderId,
      lastHeartbeat: drone.lastHeartbeat,
      totalDeliveries: drone.totalDeliveries,
      totalFlightTime: drone.totalFlightTime,
    }));

    // Calculate summary statistics
    const allDrones = await this.droneRepository.find();
    const summary = {
      operational: allDrones.filter((d) => d.status === DroneStatus.OPERATIONAL).length,
      broken: allDrones.filter((d) => d.status === DroneStatus.BROKEN).length,
      inTransit: allDrones.filter((d) => d.status === DroneStatus.IN_TRANSIT).length,
      idle: allDrones.filter((d) => d.status === DroneStatus.IDLE).length,
    };

    return {
      drones: droneDtos,
      total,
      summary,
    };
  }

  /**
   * Update drone status (mark as operational or broken)
   * If marking as operational, resolves any open breakage events
   */
  async updateDroneStatus(
    droneId: string,
    statusDto: UpdateDroneStatusDto,
    adminName: string,
  ): Promise<UpdateDroneStatusResponseDto> {
    const drone = await this.droneRepository.findOne({
      where: { id: droneId },
    });

    if (!drone) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.DRONE_001]);
    }

    const previousStatus = drone.status;

    // Update drone status
    drone.status = statusDto.status;

    // If marking as operational (fixed), update maintenance timestamp
    if (statusDto.status === DroneStatus.OPERATIONAL) {
      drone.lastMaintenanceAt = new Date();

      // Resolve any open breakage events
      const openBreakages = await this.breakageRepository.find({
        where: {
          droneId: drone.id,
          resolvedAt: null as any,
        },
      });

      for (const breakage of openBreakages) {
        breakage.resolvedAt = new Date();
        breakage.resolutionNotes = statusDto.reason;
      }

      if (openBreakages.length > 0) {
        await this.breakageRepository.save(openBreakages);
      }

      // Drone becomes idle and available for jobs
      drone.status = DroneStatus.IDLE;
    } else if (statusDto.status === DroneStatus.BROKEN) {
      // If admin marks as broken, create breakage event
      const breakage = this.breakageRepository.create({
        droneId: drone.id,
        location: drone.currentLocation,
        issue: statusDto.reason,
        severity: 'medium' as any,
        wasCarryingOrder: !!drone.currentOrderId,
        orderId: drone.currentOrderId ?? null,
      });
      await this.breakageRepository.save(breakage);
    }

    await this.droneRepository.save(drone);

    return {
      droneId: drone.id,
      previousStatus,
      newStatus: drone.status,
      updatedAt: new Date(),
      updatedBy: adminName,
    };
  }

  /**
   * Create a new drone
   * Registers a new drone in the system with specified capabilities
   */
  async createDrone(createDto: CreateDroneDto): Promise<DroneResponseDto> {
    // Check if drone with same ID already exists
    if (createDto.id) {
      const existing = await this.droneRepository.findOne({
        where: { id: createDto.id },
      });

      if (existing) {
        throw new ConflictException(
          ErrorCodes.DRONE_001,
          `Drone with ID ${createDto.id} already exists`,
        );
      }
    }

    // Create drone entity
    const drone = this.droneRepository.create({
      id: createDto.id, // Will be auto-generated if not provided
      model: createDto.model,
      status: createDto.status || DroneStatus.IDLE,
      currentLocation: {
        latitude: createDto.currentLocation.latitude,
        longitude: createDto.currentLocation.longitude,
        altitude: createDto.currentLocation.altitude ?? 0,
        address: createDto.currentLocation.address ?? undefined,
        timestamp: createDto.currentLocation.timestamp || new Date(),
      },
      homeBase: {
        latitude: createDto.homeBase.latitude,
        longitude: createDto.homeBase.longitude,
        altitude: createDto.homeBase.altitude ?? 0,
        address: createDto.homeBase.address ?? undefined,
        timestamp: createDto.homeBase.timestamp || new Date(),
      },
      batteryLevel: createDto.batteryLevel ?? 100,
      capabilities: createDto.capabilities,
      maxPayload: createDto.maxPayload,
      maxRange: createDto.maxRange,
      speed: 0,
      currentOrderId: undefined,
      totalDeliveries: 0,
      totalFlightTime: 0,
      lastHeartbeat: undefined,
      lastMaintenanceAt: new Date(),
    });

    const savedDrone = await this.droneRepository.save(drone);

    return this.mapDroneToResponse(savedDrone);
  }

  /**
   * Get drone by ID
   * Returns detailed information about a specific drone
   */
  async getDroneById(droneId: string): Promise<DroneResponseDto> {
    const drone = await this.droneRepository.findOne({
      where: { id: droneId },
    });

    if (!drone) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.DRONE_001]);
    }

    return this.mapDroneToResponse(drone);
  }

  /**
   * Update drone details
   * Allows updating drone specifications and configuration
   */
  async updateDrone(droneId: string, updateDto: UpdateDroneDto): Promise<DroneResponseDto> {
    const drone = await this.droneRepository.findOne({
      where: { id: droneId },
    });

    if (!drone) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.DRONE_001]);
    }

    // Update provided fields
    if (updateDto.model !== undefined) {
      drone.model = updateDto.model;
    }

    if (updateDto.status !== undefined) {
      drone.status = updateDto.status;
    }

    if (updateDto.currentLocation) {
      drone.currentLocation = {
        latitude: updateDto.currentLocation.latitude,
        longitude: updateDto.currentLocation.longitude,
        altitude: updateDto.currentLocation.altitude ?? drone.currentLocation.altitude ?? 0,
        address: updateDto.currentLocation.address ?? drone.currentLocation.address ?? null,
        timestamp: updateDto.currentLocation.timestamp || new Date(),
      };
    }

    if (updateDto.homeBase) {
      drone.homeBase = {
        latitude: updateDto.homeBase.latitude,
        longitude: updateDto.homeBase.longitude,
        altitude: updateDto.homeBase.altitude ?? drone.homeBase.altitude ?? 0,
        address: updateDto.homeBase.address ?? drone.homeBase.address ?? null,
        timestamp: updateDto.homeBase.timestamp || new Date(),
      };
    }

    if (updateDto.batteryLevel !== undefined) {
      drone.batteryLevel = updateDto.batteryLevel;
    }

    if (updateDto.capabilities !== undefined) {
      drone.capabilities = updateDto.capabilities;
    }

    if (updateDto.maxPayload !== undefined) {
      drone.maxPayload = updateDto.maxPayload;
    }

    if (updateDto.maxRange !== undefined) {
      drone.maxRange = updateDto.maxRange;
    }

    const updatedDrone = await this.droneRepository.save(drone);

    return this.mapDroneToResponse(updatedDrone);
  }

  /**
   * Delete a drone
   * Removes drone from system (only if not currently assigned to an order)
   */
  async deleteDrone(droneId: string): Promise<{ message: string }> {
    const drone = await this.droneRepository.findOne({
      where: { id: droneId },
    });

    if (!drone) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.DRONE_001]);
    }

    // Cannot delete drone that's currently on a delivery
    if (drone.currentOrderId) {
      throw new ConflictException(
        ErrorCodes.DRONE_002,
        'Cannot delete drone that is currently assigned to an order',
      );
    }

    // Cannot delete drone that's in transit
    if (drone.status === DroneStatus.IN_TRANSIT) {
      throw new ConflictException(
        ErrorCodes.DRONE_002,
        'Cannot delete drone that is in transit',
      );
    }

    await this.droneRepository.remove(drone);

    return {
      message: `Drone ${droneId} deleted successfully`,
    };
  }

  /**
   * Map drone entity to response DTO
   */
  private mapDroneToResponse(drone: Drone): DroneResponseDto {
    return {
      id: drone.id,
      model: drone.model,
      status: drone.status,
      currentLocation: drone.currentLocation,
      homeBase: drone.homeBase,
      batteryLevel: drone.batteryLevel,
      capabilities: drone.capabilities,
      maxPayload: drone.maxPayload,
      maxRange: drone.maxRange,
      speed: drone.speed,
      currentOrderId: drone.currentOrderId,
      lastHeartbeat: drone.lastHeartbeat,
      totalDeliveries: drone.totalDeliveries,
      totalFlightTime: drone.totalFlightTime,
      createdAt: drone.createdAt,
      lastMaintenanceAt: drone.lastMaintenanceAt,
    };
  }
}
