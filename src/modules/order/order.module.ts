import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderModification } from './entities/order-modification.entity';

/**
 * Order module
 * Manages the complete order lifecycle for deliveries
 */
@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderModification])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
