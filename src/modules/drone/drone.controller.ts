import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DroneService } from './drone.service';
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { UserType } from '../../common/enums/index';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

/**
 * Drone controller
 * Handles all drone operations: job management, order handling, status reporting
 */
@ApiTags('Drones')
@Controller('drones')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DroneController {
  constructor(private readonly droneService: DroneService) {}

  /**
   * Reserve a job for a drone
   * POST /api/v1/drones/jobs/reserve
   */
  @Post('jobs/reserve')
  @Roles(UserType.DRONE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reserve a job for drone' })
  @ApiResponse({
    status: 200,
    description: 'Job reserved successfully',
    type: ReserveJobResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No jobs available',
  })
  async reserveJob(@Body() request: ReserveJobRequestDto): Promise<ReserveJobResponseDto> {
    return this.droneService.reserveJob(request);
  }

  /**
   * Grab (pick up) an order
   * POST /api/v1/drones/orders/grab
   */
  @Post('orders/grab')
  @Roles(UserType.DRONE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pick up an order' })
  @ApiResponse({
    status: 200,
    description: 'Order grabbed successfully',
    type: GrabOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Drone not at pickup location',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async grabOrder(@Body() request: GrabOrderRequestDto): Promise<GrabOrderResponseDto> {
    return this.droneService.grabOrder(request);
  }

  /**
   * Mark delivery status (delivered or failed)
   * PUT /api/v1/drones/orders/:orderId/status
   */
  @Put('orders/:orderId/status')
  @Roles(UserType.DRONE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark order as delivered or failed' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Drone not at delivery location',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() statusDto: UpdateOrderStatusDto,
  ) {
    return this.droneService.updateDeliveryStatus(orderId, statusDto);
  }

  /**
   * Report drone as broken
   * POST /api/v1/drones/report-broken
   */
  @Post('report-broken')
  @Roles(UserType.DRONE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report drone malfunction' })
  @ApiResponse({
    status: 200,
    description: 'Breakage reported successfully',
    type: ReportBrokenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Drone not found',
  })
  async reportBroken(@Body() reportDto: ReportBrokenDto): Promise<ReportBrokenResponseDto> {
    return this.droneService.reportBroken(reportDto);
  }

  /**
   * Send heartbeat with location and status
   * POST /api/v1/drones/heartbeat
   */
  @Post('heartbeat')
  @Roles(UserType.DRONE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send drone heartbeat with location and battery status' })
  @ApiResponse({
    status: 200,
    description: 'Heartbeat processed',
    type: HeartbeatResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Drone not found',
  })
  async heartbeat(@Body() heartbeat: HeartbeatRequestDto): Promise<HeartbeatResponseDto> {
    return this.droneService.processHeartbeat(heartbeat);
  }

  /**
   * Get current order details
   * GET /api/v1/drones/orders/current
   */
  @Get('orders/current')
  @Roles(UserType.DRONE)
  @ApiOperation({ summary: 'Get current order details for drone' })
  @ApiResponse({
    status: 200,
    description: 'Current order details',
    type: CurrentOrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No current order',
  })
  async getCurrentOrder(@CurrentUser() user: JwtPayload): Promise<CurrentOrderResponseDto> {
    // In this implementation, drone name is used as ID
    // In production, you'd have proper drone authentication
    return this.droneService.getCurrentOrder(user.sub);
  }
}
