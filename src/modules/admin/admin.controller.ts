import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  CreateDroneDto,
  UpdateDroneDto,
  DroneResponseDto,
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

  /**
   * Create a new drone
   * POST /api/v1/admin/drones
   */
  @Post('drones')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new drone in the system' })
  @ApiResponse({
    status: 201,
    description: 'Drone created successfully',
    type: DroneResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Drone with this ID already exists',
  })
  async createDrone(@Body() createDto: CreateDroneDto): Promise<DroneResponseDto> {
    return this.adminService.createDrone(createDto);
  }

  /**
   * Get drone by ID
   * GET /api/v1/admin/drones/:droneId
   */
  @Get('drones/:droneId')
  @ApiOperation({ summary: 'Get detailed information about a specific drone' })
  @ApiResponse({
    status: 200,
    description: 'Drone details retrieved successfully',
    type: DroneResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Drone not found',
  })
  async getDroneById(@Param('droneId') droneId: string): Promise<DroneResponseDto> {
    return this.adminService.getDroneById(droneId);
  }

  /**
   * Update drone details
   * PUT /api/v1/admin/drones/:droneId
   */
  @Put('drones/:droneId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update drone specifications and configuration' })
  @ApiResponse({
    status: 200,
    description: 'Drone updated successfully',
    type: DroneResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Drone not found',
  })
  async updateDrone(
    @Param('droneId') droneId: string,
    @Body() updateDto: UpdateDroneDto,
  ): Promise<DroneResponseDto> {
    return this.adminService.updateDrone(droneId, updateDto);
  }

  /**
   * Delete a drone
   * DELETE /api/v1/admin/drones/:droneId
   */
  @Delete('drones/:droneId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a drone from the system' })
  @ApiResponse({
    status: 200,
    description: 'Drone deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Drone drone-001 deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Drone not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete drone (currently assigned to order)',
  })
  async deleteDrone(@Param('droneId') droneId: string): Promise<{ message: string }> {
    return this.adminService.deleteDrone(droneId);
  }
}
