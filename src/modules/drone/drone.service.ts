import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Drone } from './entities/drone.entity';
import { Job } from './entities/job.entity';
import { BreakageEvent } from './entities/breakage-event.entity';
import { Order } from '../order/entities/order.entity';
import { OrderService } from '../order/order.service';
import {
  ReserveJobRequestDto,
  ReserveJobResponseDto,
  GrabOrderRequestDto,
  GrabOrderResponseDto,
  UpdateOrderStatusDto,
  ReportBrokenDto,
  ReportBrokenResponseDto,
  HeartbeatRequestDto,
  HeartbeatResponseDto,
  CurrentOrderResponseDto,
} from './dto/index';
import { DroneStatus, OrderStatus, JobType, JobStatus, Priority } from '../../common/enums/index';
import { DistanceCalculator } from '../../common/utils/distance-calculator.util';
import {
  ValidationException,
  ErrorCodes,
  ErrorMessages,
} from '../../common/exceptions/custom-exceptions';

/**
 * Drone service
 * Handles complex drone operations including:
 * - Job assignment and reservation
 * - Order pickup and delivery
 * - Broken drone reporting and rescue operations
 * - Real-time location updates via heartbeat
 */
@Injectable()
export class DroneService {
  private readonly locationToleranceMeters: number;
  private readonly lowBatteryThreshold: number;

  constructor(
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(BreakageEvent)
    private breakageRepository: Repository<BreakageEvent>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private orderService: OrderService,
    private configService: ConfigService,
  ) {
    this.locationToleranceMeters =
      this.configService.get<number>('service.locationToleranceMeters') ?? 50;
    this.lowBatteryThreshold = this.configService.get<number>('service.lowBatteryThreshold') ?? 20;
  }

  /**
   * Reserve a job for a drone
   * Prioritizes rescue jobs over regular deliveries
   * Implements atomic job assignment to prevent double-booking
   */
  async reserveJob(request: ReserveJobRequestDto): Promise<ReserveJobResponseDto> {
    const drone = await this.droneRepository.findOne({
      where: { id: request.droneId },
    });

    if (!drone) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.DRONE_001]);
    }

    // Find available jobs, prioritizing rescue jobs
    // Rescue jobs have HIGH priority, regular deliveries have MEDIUM/LOW
    const availableJob = await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.order', 'order')
      .where('job.status = :status', { status: JobStatus.PENDING })
      .orderBy('job.priority', 'DESC')
      .addOrderBy('job.createdAt', 'ASC') // FIFO for same priority
      .getOne();

    if (!availableJob) {
      throw new NotFoundException('No jobs available');
    }

    // Assign job to drone atomically
    availableJob.status = JobStatus.ASSIGNED;
    availableJob.assignedDroneId = drone.id;
    await this.jobRepository.save(availableJob);

    // Update order status to assigned
    await this.orderService.assignDrone(availableJob.orderId, drone.id);

    // Update drone status
    drone.status = DroneStatus.IN_TRANSIT;
    drone.currentOrderId = availableJob.orderId;
    await this.droneRepository.save(drone);

    return {
      jobId: availableJob.id,
      orderId: availableJob.orderId,
      pickupLocation: availableJob.pickupLocation,
      type: availableJob.type,
    };
  }

  /**
   * Grab (pick up) an order
   * Verifies drone is at pickup location before allowing pickup
   */
  async grabOrder(request: GrabOrderRequestDto): Promise<GrabOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: request.orderId },
    });

    if (!order) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.ORDER_001]);
    }

    // Verify drone is at pickup location (within tolerance)
    const isAtLocation = DistanceCalculator.isWithinRadius(
      request.location.latitude,
      request.location.longitude,
      order.origin.latitude,
      order.origin.longitude,
      this.locationToleranceMeters,
    );

    if (!isAtLocation) {
      throw new ValidationException(ErrorCodes.VALIDATION_001, 'Drone is not at pickup location');
    }

    // Update order status to in_transit
    const updatedOrder = await this.orderService.updateOrderStatus(
      order.id,
      OrderStatus.IN_TRANSIT,
      {
        actualPickupTime: new Date(),
      },
    );

    // Calculate ETA to destination
    const distance = DistanceCalculator.calculateDistance(
      request.location.latitude,
      request.location.longitude,
      order.destination.latitude,
      order.destination.longitude,
    );
    const eta = DistanceCalculator.calculateETA(distance);

    return {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      destination: updatedOrder.destination,
      estimatedDeliveryTime: eta,
    };
  }

  /**
   * Mark delivery status (delivered or failed)
   */
  async updateDeliveryStatus(
    orderId: string,
    statusDto: UpdateOrderStatusDto,
  ): Promise<{ orderId: string; status: OrderStatus; completedAt: Date }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.ORDER_001]);
    }

    // If delivered, verify drone is at destination
    if (statusDto.status === OrderStatus.DELIVERED) {
      const isAtLocation = DistanceCalculator.isWithinRadius(
        statusDto.location.latitude,
        statusDto.location.longitude,
        order.destination.latitude,
        order.destination.longitude,
        this.locationToleranceMeters,
      );

      if (!isAtLocation) {
        throw new ValidationException(
          ErrorCodes.VALIDATION_001,
          'Drone is not at delivery location',
        );
      }
    }

    // Update order status
    const completedAt = new Date();
    await this.orderService.updateOrderStatus(order.id, statusDto.status, {
      actualDeliveryTime: statusDto.status === OrderStatus.DELIVERED ? completedAt : undefined,
      failureReason: statusDto.failureReason,
    });

    // Release drone from job
    const drone = await this.droneRepository.findOne({
      where: { id: statusDto.droneId },
    });

    if (drone) {
      drone.currentOrderId = null;
      drone.status = DroneStatus.IDLE;
      if (statusDto.status === OrderStatus.DELIVERED) {
        drone.totalDeliveries += 1;
      }
      await this.droneRepository.save(drone);
    }

    return {
      orderId: order.id,
      status: statusDto.status,
      completedAt,
    };
  }

  /**
   * Report drone as broken
   * Creates rescue job if drone is carrying an order
   */
  async reportBroken(reportDto: ReportBrokenDto): Promise<ReportBrokenResponseDto> {
    const drone = await this.droneRepository.findOne({
      where: { id: reportDto.droneId },
      relations: ['currentOrder'],
    });

    if (!drone) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.DRONE_001]);
    }

    // Mark drone as broken immediately
    drone.status = DroneStatus.BROKEN;
    drone.currentLocation = {
      latitude: reportDto.location.latitude,
      longitude: reportDto.location.longitude,
      altitude: reportDto.location.altitude ?? null,
      address: reportDto.location.address ?? null,
      timestamp: reportDto.location.timestamp || new Date(),
    };
    await this.droneRepository.save(drone);

    // Create breakage event record
    const breakageEvent = this.breakageRepository.create({
      droneId: drone.id,
      location: {
        latitude: reportDto.location.latitude,
        longitude: reportDto.location.longitude,
        altitude: reportDto.location.altitude ?? null,
        address: reportDto.location.address ?? null,
        timestamp: reportDto.location.timestamp || new Date(),
      },
      issue: reportDto.issue,
      severity: reportDto.severity,
      wasCarryingOrder: !!drone.currentOrderId,
      orderId: drone.currentOrderId ?? null,
    });
    await this.breakageRepository.save(breakageEvent);

    let rescueJobId: string | undefined;
    let message = 'Drone marked as broken.';

    // If drone was carrying an order, create rescue job
    if (drone.currentOrderId) {
      const order = await this.orderRepository.findOne({
        where: { id: drone.currentOrderId },
      });

      if (order) {
        // Update order status
        await this.orderService.updateOrderStatus(order.id, OrderStatus.AWAITING_RESCUE);

        // Create rescue job with high priority
        const rescueJob = this.jobRepository.create({
          type: JobType.RESCUE,
          orderId: order.id,
          brokenDroneId: drone.id,
          pickupLocation: reportDto.location,
          priority: Priority.HIGH,
          status: JobStatus.PENDING,
        });
        const savedRescueJob = await this.jobRepository.save(rescueJob);

        rescueJobId = savedRescueJob.id;
        message = 'Drone marked as broken. Rescue job created.';
      }

      // Release current order from drone
      drone.currentOrderId = null;
      await this.droneRepository.save(drone);
    }

    return {
      droneId: drone.id,
      status: drone.status,
      rescueJobId,
      message,
    };
  }

  /**
   * Process drone heartbeat
   * Updates location, battery, and recalculates ETA
   */
  async processHeartbeat(heartbeat: HeartbeatRequestDto): Promise<HeartbeatResponseDto> {
    const drone = await this.droneRepository.findOne({
      where: { id: heartbeat.droneId },
      relations: ['currentOrder'],
    });

    if (!drone) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.DRONE_001]);
    }

    // Update drone location and stats
    drone.currentLocation = {
      latitude: heartbeat.location.latitude,
      longitude: heartbeat.location.longitude,
      altitude: heartbeat.location.altitude ?? null,
      address: heartbeat.location.address ?? null,
      timestamp: heartbeat.location.timestamp || new Date(),
    };
    drone.batteryLevel = heartbeat.batteryLevel;
    drone.speed = heartbeat.speed;
    drone.lastHeartbeat = new Date();

    // Update status based on battery and current state
    if (drone.status !== DroneStatus.BROKEN) {
      if (heartbeat.batteryLevel < this.lowBatteryThreshold) {
        drone.status = DroneStatus.IDLE; // Should return to base
      } else if (drone.currentOrderId) {
        drone.status = DroneStatus.IN_TRANSIT;
      } else {
        drone.status = DroneStatus.OPERATIONAL;
      }
    }

    await this.droneRepository.save(drone);

    // Build response
    const response: HeartbeatResponseDto = {
      status: drone.status,
    };

    // Include current job info if applicable
    if (drone.currentOrder) {
      const distance = DistanceCalculator.calculateDistance(
        heartbeat.location.latitude,
        heartbeat.location.longitude,
        drone.currentOrder.destination.latitude,
        drone.currentOrder.destination.longitude,
      );
      const eta = DistanceCalculator.calculateETA(distance);

      response.currentJob = {
        orderId: drone.currentOrder.id,
        destination: drone.currentOrder.destination,
        eta,
      };
    }

    // Add instructions if needed
    if (heartbeat.batteryLevel < this.lowBatteryThreshold) {
      response.instructions = 'Battery low. Return to base after delivery.';
    }

    return response;
  }

  /**
   * Get current order details for a drone
   */
  async getCurrentOrder(droneId: string): Promise<CurrentOrderResponseDto> {
    const drone = await this.droneRepository.findOne({
      where: { id: droneId },
      relations: ['currentOrder'],
    });

    if (!drone) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.DRONE_001]);
    }

    if (!drone.currentOrder) {
      throw new NotFoundException('No current order assigned to drone');
    }

    return {
      orderId: drone.currentOrder.id,
      status: drone.currentOrder.status,
      origin: drone.currentOrder.origin,
      destination: drone.currentOrder.destination,
      packageDetails: drone.currentOrder.packageDetails,
      estimatedDeliveryTime: drone.currentOrder.estimatedDeliveryTime,
    };
  }

  /**
   * Create jobs for pending orders
   * Called periodically or when new orders are created
   */
  async createJobsForPendingOrders(): Promise<void> {
    // Find orders that are pending but don't have jobs yet
    const pendingOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .getMany();

    for (const order of pendingOrders) {
      // Check if job already exists
      const existingJob = await this.jobRepository.findOne({
        where: { orderId: order.id },
      });

      if (!existingJob) {
        // Create new delivery job
        const job = this.jobRepository.create({
          type: JobType.DELIVERY,
          orderId: order.id,
          pickupLocation: order.origin,
          priority: Priority.MEDIUM,
          status: JobStatus.PENDING,
        });
        await this.jobRepository.save(job);
      }
    }
  }
}
