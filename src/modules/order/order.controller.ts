import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { CancelOrderResponseDto } from './dto/cancel-order-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { UserType } from '../../common/enums/index';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

/**
 * Order controller
 * Handles end user order operations: submit, track, cancel
 */
@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Submit a new order
   * POST /api/v1/orders
   */
  @Post()
  @Roles(UserType.ENDUSER)
  @ApiOperation({ summary: 'Submit a new delivery order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or order outside service area',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async createOrder(
    @CurrentUser() user: JwtPayload,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.orderService.createOrder(user.sub, createOrderDto);
  }

  /**
   * Track an order
   * GET /api/v1/orders/:orderId
   */
  @Get(':orderId')
  @Roles(UserType.ENDUSER)
  @ApiOperation({ summary: 'Track order status and location' })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Order does not belong to user',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async trackOrder(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.orderService.getOrderById(orderId, user.sub);
  }

  /**
   * Cancel an order
   * DELETE /api/v1/orders/:orderId
   */
  @Delete(':orderId')
  @Roles(UserType.ENDUSER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order (withdraw)' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: CancelOrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Order cannot be cancelled (already picked up)',
  })
  async cancelOrder(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
  ): Promise<CancelOrderResponseDto> {
    return this.orderService.cancelOrder(orderId, user.sub);
  }
}
