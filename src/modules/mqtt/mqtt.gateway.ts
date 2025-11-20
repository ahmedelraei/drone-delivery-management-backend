import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { MqttTopics } from './constants/mqtt-topics';
import { MqttHeartbeatDto, MqttStatusDto } from './dto/index';
import { DroneService } from '../drone/drone.service';
import { DroneStatus } from '../../common/enums/index';

/**
 * MQTT Gateway
 * Handles incoming MQTT messages from drones
 * Routes messages to appropriate services and publishes responses
 *
 * This acts as the bridge between MQTT protocol and application logic
 */
@Injectable()
export class MqttGateway implements OnModuleInit {
  private readonly logger = new Logger(MqttGateway.name);

  constructor(
    private mqttService: MqttService,
    private droneService: DroneService,
  ) {}

  /**
   * Initialize gateway and register message handlers
   */
  onModuleInit() {
    this.logger.log('Initializing MQTT Gateway');
    this.registerHandlers();
  }

  /**
   * Register all MQTT message handlers
   */
  private registerHandlers(): void {
    // Handle all drone heartbeats
    this.mqttService.registerHandler(
      MqttTopics.allDronesHeartbeat(),
      this.handleHeartbeat.bind(this),
    );

    // Handle all drone status updates
    this.mqttService.registerHandler(
      MqttTopics.allDronesStatus(),
      this.handleStatusUpdate.bind(this),
    );

    this.logger.log('MQTT message handlers registered');
  }

  /**
   * Handle drone heartbeat messages
   * Drones publish: location, battery, speed
   * Server responds: current job info, instructions
   */
  private async handleHeartbeat(topic: string, payload: MqttHeartbeatDto): Promise<void> {
    try {
      const droneId = MqttTopics.extractDroneId(topic);
      if (!droneId) {
        this.logger.warn(`Could not extract drone ID from topic: ${topic}`);
        return;
      }

      this.logger.debug(`Heartbeat from drone ${droneId}`);

      // Convert MQTT format to internal format
      const heartbeatData = {
        droneId: payload.droneId,
        location: {
          latitude: payload.location.lat,
          longitude: payload.location.lon,
          altitude: payload.location.alt,
        },
        batteryLevel: payload.battery,
        speed: payload.speed,
      };

      // Process heartbeat through drone service
      const response = await this.droneService.processHeartbeat(heartbeatData);

      // Prepare MQTT acknowledgment
      const ack: any = {
        status: 'ok',
        serverTime: Date.now(),
      };

      // Include current job info if available
      if (response.currentJob) {
        ack.currentJob = {
          orderId: response.currentJob.orderId,
          destLat: response.currentJob.destination.latitude,
          destLon: response.currentJob.destination.longitude,
          eta: response.currentJob.eta.getTime(),
        };
      }

      // Include instructions if any
      if (response.instructions) {
        ack.instructions = response.instructions;
      }

      // Send acknowledgment back to drone
      await this.mqttService.publishHeartbeatAck(droneId, ack);

      // If drone has current order, publish location for real-time tracking
      if (response.currentJob) {
        await this.publishOrderLocation(
          response.currentJob.orderId,
          droneId,
          heartbeatData.location,
          heartbeatData.speed,
          response.currentJob.eta,
        );
      }
    } catch (error) {
      this.logger.error('Error handling heartbeat:', error);
    }
  }

  /**
   * Handle drone status update messages
   * Drones publish when status changes: operational, broken, idle, etc.
   */
  private async handleStatusUpdate(topic: string, payload: MqttStatusDto): Promise<void> {
    try {
      const droneId = MqttTopics.extractDroneId(topic);
      if (!droneId) {
        this.logger.warn(`Could not extract drone ID from topic: ${topic}`);
        return;
      }

      this.logger.log(`Status update from drone ${droneId}: ${payload.status}`);

      // If drone reports broken status via MQTT, process it
      if (payload.status === DroneStatus.BROKEN && payload.location) {
        await this.droneService.reportBroken({
          droneId: payload.droneId,
          location: {
            latitude: payload.location.lat,
            longitude: payload.location.lon,
            altitude: payload.location.alt,
          },
          issue: payload.reason || 'Status reported via MQTT',
          severity: 'medium' as any,
        });
      }

      // Send acknowledgment
      await this.mqttService.publish(`${topic}/ack`, {
        received: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error('Error handling status update:', error);
    }
  }

  /**
   * Publish location update for order tracking
   * This allows end users to track their orders in real-time
   */
  private async publishOrderLocation(
    orderId: string,
    droneId: string,
    location: any,
    speed: number,
    eta: Date,
  ): Promise<void> {
    try {
      const locationUpdate = {
        orderId,
        droneId,
        location: {
          lat: location.latitude,
          lon: location.longitude,
          alt: location.altitude,
        },
        speed,
        eta: eta.getTime(),
        timestamp: Date.now(),
      };

      await this.mqttService.publishOrderLocation(orderId, locationUpdate);
    } catch (error) {
      this.logger.error('Error publishing order location:', error);
    }
  }

  /**
   * Send command to specific drone
   * Used by services to communicate with drones
   */
  async sendCommandToDrone(droneId: string, command: any): Promise<void> {
    try {
      await this.mqttService.publishCommand(droneId, command);
      this.logger.log(`Command sent to drone ${droneId}: ${command.type}`);
    } catch (error) {
      this.logger.error(`Error sending command to drone ${droneId}:`, error);
      throw error;
    }
  }
}
