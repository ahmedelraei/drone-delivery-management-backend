import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { MqttTopics } from './constants/mqtt-topics';
import { MqttHeartbeatAckDto, MqttCommandDto, MqttLocationDto } from './dto/index';

/**
 * MQTT Service
 * Handles MQTT client connection, publishing, and subscription management
 * Provides high-level API for drone communication via MQTT
 */
@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;
  private messageHandlers: Map<string, (topic: string, payload: any) => void> = new Map();

  constructor(private configService: ConfigService) {}

  /**
   * Initialize MQTT connection on module startup
   */
  async onModuleInit() {
    await this.connect();
  }

  /**
   * Cleanup MQTT connection on module destroy
   */
  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to MQTT broker
   */
  private async connect(): Promise<void> {
    const brokerUrl = this.configService.get<string>('mqtt.brokerUrl');
    const username = this.configService.get<string>('mqtt.username');
    const password = this.configService.get<string>('mqtt.password');
    const clientId = this.configService.get<string>('mqtt.clientId');
    const reconnectPeriod = this.configService.get<number>('mqtt.reconnectPeriod');
    const connectTimeout = this.configService.get<number>('mqtt.connectTimeout');
    const keepAlive = this.configService.get<number>('mqtt.keepAlive');

    this.logger.log(`Connecting to MQTT broker at ${brokerUrl}`);

    if (!brokerUrl) {
      throw new Error('MQTT broker URL is not configured');
    }

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      username,
      password,
      reconnectPeriod,
      connectTimeout,
      keepalive: keepAlive,
      clean: true, // Clean session
      will: {
        // Last Will and Testament - notify if server disconnects unexpectedly
        topic: 'system/server/status',
        payload: JSON.stringify({ status: 'offline', timestamp: Date.now() }),
        qos: 1,
        retain: true,
      },
    });

    // Setup event handlers
    this.client.on('connect', () => {
      this.logger.log('Connected to MQTT broker');
      this.onConnect();
    });

    this.client.on('error', (error) => {
      this.logger.error('MQTT connection error:', error);
    });

    this.client.on('reconnect', () => {
      this.logger.warn('Reconnecting to MQTT broker...');
    });

    this.client.on('offline', () => {
      this.logger.warn('MQTT client offline');
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });

    // Wait for connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MQTT connection timeout'));
      }, connectTimeout);

      this.client.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Handle successful connection
   * Subscribe to all relevant topics
   */
  private onConnect(): void {
    // Subscribe to all drone heartbeats
    this.subscribe(MqttTopics.allDronesHeartbeat(), 1);

    // Subscribe to all drone status updates
    this.subscribe(MqttTopics.allDronesStatus(), 1);

    // Publish server online status
    this.publish(
      'system/server/status',
      { status: 'online', timestamp: Date.now() },
      {
        retain: true,
      },
    );
  }

  /**
   * Disconnect from MQTT broker
   */
  private async disconnect(): Promise<void> {
    if (this.client) {
      this.logger.log('Disconnecting from MQTT broker');

      // Publish server offline status
      await this.publish(
        'system/server/status',
        { status: 'offline', timestamp: Date.now() },
        {
          retain: true,
        },
      );

      return new Promise((resolve) => {
        this.client.end(false, {}, () => {
          this.logger.log('Disconnected from MQTT broker');
          resolve();
        });
      });
    }
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, qos: 0 | 1 | 2 = 1): void {
    if (!this.client) {
      this.logger.warn('Cannot subscribe - MQTT client not connected');
      return;
    }

    this.client.subscribe(topic, { qos }, (error) => {
      if (error) {
        this.logger.error(`Failed to subscribe to ${topic}:`, error);
      } else {
        this.logger.log(`Subscribed to topic: ${topic}`);
      }
    });
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string): void {
    if (!this.client) {
      return;
    }

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        this.logger.error(`Failed to unsubscribe from ${topic}:`, error);
      } else {
        this.logger.log(`Unsubscribed from topic: ${topic}`);
      }
    });
  }

  /**
   * Publish a message to a topic
   */
  async publish(
    topic: string,
    payload: any,
    options: { qos?: 0 | 1 | 2; retain?: boolean } = {},
  ): Promise<void> {
    if (!this.client) {
      this.logger.warn('Cannot publish - MQTT client not connected');
      return;
    }

    const message = JSON.stringify(payload);
    const { qos = 1, retain = false } = options;

    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, { qos, retain }, (error) => {
        if (error) {
          this.logger.error(`Failed to publish to ${topic}:`, error);
          reject(error);
        } else {
          this.logger.debug(`Published to ${topic}: ${message.substring(0, 100)}`);
          resolve();
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private handleMessage(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());
      this.logger.debug(`Received message on ${topic}`);

      // Call registered handlers for this topic pattern
      for (const [pattern, handler] of this.messageHandlers) {
        if (this.topicMatches(topic, pattern)) {
          handler(topic, payload);
        }
      }
    } catch (error) {
      this.logger.error(`Error parsing message from ${topic}:`, error);
    }
  }

  /**
   * Register a message handler for a topic pattern
   */
  registerHandler(topicPattern: string, handler: (topic: string, payload: any) => void): void {
    this.messageHandlers.set(topicPattern, handler);
    this.logger.log(`Registered handler for topic pattern: ${topicPattern}`);
  }

  /**
   * Remove a message handler
   */
  unregisterHandler(topicPattern: string): void {
    this.messageHandlers.delete(topicPattern);
  }

  /**
   * Check if a topic matches a pattern (supports + wildcard)
   */
  private topicMatches(topic: string, pattern: string): boolean {
    const topicParts = topic.split('/');
    const patternParts = pattern.split('/');

    if (topicParts.length !== patternParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] !== '+' && patternParts[i] !== topicParts[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Publish heartbeat acknowledgment to drone
   */
  async publishHeartbeatAck(droneId: string, ack: MqttHeartbeatAckDto): Promise<void> {
    const topic = `${MqttTopics.droneHeartbeat(droneId)}/ack`;
    await this.publish(topic, ack);
  }

  /**
   * Publish command to drone
   */
  async publishCommand(droneId: string, command: MqttCommandDto): Promise<void> {
    const topic = MqttTopics.droneCommands(droneId);
    await this.publish(topic, command, { qos: 2 }); // QoS 2 for critical commands
  }

  /**
   * Publish location update for order tracking
   */
  async publishOrderLocation(orderId: string, location: MqttLocationDto): Promise<void> {
    const topic = MqttTopics.orderLocation(orderId);
    await this.publish(topic, location);
  }

  /**
   * Check if MQTT client is connected
   */
  isConnected(): boolean {
    return this.client && this.client.connected;
  }
}
