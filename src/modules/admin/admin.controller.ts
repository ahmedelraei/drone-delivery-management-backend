import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  GetOrdersQueryDto,
  OrdersBulkResponseDto,
  ModifyOrderDto,
  ModifyOrderResponseDto,
  GetDronesQueryDto,
  DronesFleetResponseDto,
  UpdateDroneStatusDto,
  UpdateDroneStatusResponseDto,
} from './dto/index';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { UserType } from '../../common/enums/index';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

/**
 * Admin controller
 * Handles administrative operations for system monitoring and management
 */
@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get orders in bulk with filtering
   * GET /api/v1/admin/orders
   */
  @Get('orders')
  @ApiOperation({ summary: 'Get orders with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: OrdersBulkResponseDto,
  })
  async getOrders(@Query() query: GetOrdersQueryDto): Promise<OrdersBulkResponseDto> {
    return this.adminService.getOrders(query);
  }

  /**
   * Modify order route
   * PUT /api/v1/admin/orders/:orderId
   */
  @Put('orders/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Modify order origin or destination' })
  @ApiResponse({
    status: 200,
    description: 'Order modified successfully',
    type: ModifyOrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Order cannot be modified (already completed)',
  })
  async modifyOrder(
    @CurrentUser() admin: JwtPayload,
    @Param('orderId') orderId: string,
    @Body() modifyDto: ModifyOrderDto,
  ): Promise<ModifyOrderResponseDto> {
    return this.adminService.modifyOrder(orderId, modifyDto, admin.name);
  }

  /**
   * Get drone fleet status
   * GET /api/v1/admin/drones
   */
  @Get('drones')
  @ApiOperation({ summary: 'Get drone fleet status and statistics' })
  @ApiResponse({
    status: 200,
    description: 'Fleet status retrieved successfully',
    type: DronesFleetResponseDto,
  })
  async getDroneFleet(@Query() query: GetDronesQueryDto): Promise<DronesFleetResponseDto> {
    return this.adminService.getDroneFleet(query);
  }

  /**
   * Update drone status
   * PUT /api/v1/admin/drones/:droneId/status
   */
  @Put('drones/:droneId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update drone operational status' })
  @ApiResponse({
    status: 200,
    description: 'Drone status updated successfully',
    type: UpdateDroneStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Drone not found',
  })
  async updateDroneStatus(
    @CurrentUser() admin: JwtPayload,
    @Param('droneId') droneId: string,
    @Body() statusDto: UpdateDroneStatusDto,
  ): Promise<UpdateDroneStatusResponseDto> {
    return this.adminService.updateDroneStatus(droneId, statusDto, admin.name);
  }
}
