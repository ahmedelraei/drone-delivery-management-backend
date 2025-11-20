import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Order } from '../order/entities/order.entity';
import { OrderModification } from '../order/entities/order-modification.entity';
import { Drone } from '../drone/entities/drone.entity';
import { BreakageEvent } from '../drone/entities/breakage-event.entity';

/**
 * Admin module
 * Provides administrative functions for system monitoring and management
 */
@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderModification, Drone, BreakageEvent])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
