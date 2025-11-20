import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderModification } from './entities/order-modification.entity';
import { Drone } from '../drone/entities/drone.entity';
import { Job } from '../drone/entities/job.entity';

/**
 * Order module
 * Manages the complete order lifecycle for deliveries
 * Includes automatic drone assignment on order creation
 */
@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderModification, Drone, Job])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
