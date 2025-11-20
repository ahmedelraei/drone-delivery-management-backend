import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { MqttGateway } from './mqtt.gateway';
import { DroneModule } from '../drone/drone.module';

/**
 * MQTT Module
 * Provides MQTT communication infrastructure for real-time drone operations
 *
 * Features:
 * - MQTT broker connection management
 * - Pub/Sub messaging for drones
 * - Real-time heartbeat processing
 * - Command dispatch to drones
 * - Order location broadcasting
 */
@Module({
  imports: [DroneModule],
  providers: [MqttService, MqttGateway],
  exports: [MqttService, MqttGateway],
})
export class MqttModule {}
