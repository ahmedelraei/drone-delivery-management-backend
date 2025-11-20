import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drone } from './entities/drone.entity';
import { DroneStatus } from '../../common/enums/drone-status.enum';

/**
 * Drone Seeder Service
 * Automatically seeds drones on application startup if none exist
 * This ensures there are always drones available for testing and operations
 */
@Injectable()
export class DroneSeeder implements OnModuleInit {
  private readonly logger = new Logger(DroneSeeder.name);

  constructor(
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
  ) {}

  /**
   * Run seeding on module initialization
   */
  async onModuleInit() {
    await this.seedDrones();
  }

  /**
   * Seed drones if database is empty
   */
  async seedDrones(): Promise<void> {
    try {
      const count = await this.droneRepository.count();

      if (count > 0) {
        this.logger.log(`Drones already exist (${count} drones found). Skipping seeding.`);
        return;
      }

      this.logger.log('No drones found. Seeding initial drones...');

      const seedDrones = this.getInitialDrones();

      for (const droneData of seedDrones) {
        const drone = this.droneRepository.create(droneData);
        await this.droneRepository.save(drone);
        this.logger.log(`✅ Seeded drone: ${drone.id} (${drone.model})`);
      }

      this.logger.log(`🎉 Successfully seeded ${seedDrones.length} drones`);
    } catch (error) {
      this.logger.error('Failed to seed drones:', error);
      // Don't throw - allow app to start even if seeding fails
    }
  }

  /**
   * Get initial drones configuration
   */
  private getInitialDrones() {
    const baseLocation = {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0,
      address: 'San Francisco Distribution Center',
      timestamp: new Date(),
    };

    return [
      {
        model: 'DX-200',
        status: DroneStatus.OPERATIONAL,
        currentLocation: { ...baseLocation },
        homeBase: { ...baseLocation },
        batteryLevel: 100,
        capabilities: ['standard', 'fragile'],
        maxPayload: 10.0,
        maxRange: 50.0,
        speed: 0,
        totalDeliveries: 0,
        totalFlightTime: 0,
        lastMaintenanceAt: new Date(),
      },
      {
        model: 'HeavyLifter-Pro',
        status: DroneStatus.OPERATIONAL,
        currentLocation: { ...baseLocation },
        homeBase: { ...baseLocation },
        batteryLevel: 100,
        capabilities: ['standard', 'heavy'],
        maxPayload: 25.0,
        maxRange: 40.0,
        speed: 0,
        totalDeliveries: 0,
        totalFlightTime: 0,
        lastMaintenanceAt: new Date(),
      },
      {
        model: 'SpeedDrone-X1',
        status: DroneStatus.OPERATIONAL,
        currentLocation: { ...baseLocation },
        homeBase: { ...baseLocation },
        batteryLevel: 100,
        capabilities: ['standard', 'express'],
        maxPayload: 5.0,
        maxRange: 80.0,
        speed: 0,
        totalDeliveries: 0,
        totalFlightTime: 0,
        lastMaintenanceAt: new Date(),
      },
      {
        model: 'AllPurpose-500',
        status: DroneStatus.OPERATIONAL,
        currentLocation: { ...baseLocation },
        homeBase: { ...baseLocation },
        batteryLevel: 100,
        capabilities: ['standard', 'fragile', 'heavy'],
        maxPayload: 15.0,
        maxRange: 60.0,
        speed: 0,
        totalDeliveries: 0,
        totalFlightTime: 0,
        lastMaintenanceAt: new Date(),
      },
      {
        model: 'EconoLite-100',
        status: DroneStatus.IDLE,
        currentLocation: { ...baseLocation },
        homeBase: { ...baseLocation },
        batteryLevel: 85,
        capabilities: ['standard'],
        maxPayload: 8.0,
        maxRange: 45.0,
        speed: 0,
        totalDeliveries: 0,
        totalFlightTime: 0,
        lastMaintenanceAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    ];
  }
}

