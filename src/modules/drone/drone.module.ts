import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DroneController } from './drone.controller';
import { DroneService } from './drone.service';
import { DroneSeeder } from './drone.seeder';
import { Drone } from './entities/drone.entity';
import { Job } from './entities/job.entity';
import { BreakageEvent } from './entities/breakage-event.entity';
import { Order } from '../order/entities/order.entity';
import { OrderModule } from '../order/order.module';

/**
 * Drone module
 * Handles drone operations, job assignments, and fault management
 */
@Module({
  imports: [TypeOrmModule.forFeature([Drone, Job, BreakageEvent, Order]), OrderModule],
  controllers: [DroneController],
  providers: [DroneService, DroneSeeder],
  exports: [DroneService],
})
export class DroneModule {}
