import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

/**
 * RefreshToken entity
 * Stores refresh tokens for the token rotation strategy
 * Each token can only be used once - attempting to reuse triggers security alert
 */
@Entity('refresh_tokens')
@Index(['tokenHash'], { unique: true })
@Index(['jti'], { unique: true })
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The user this token belongs to
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // SHA-256 hash of the refresh token (never store actual token)
  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  tokenHash: string;

  // JWT ID from token claims - used for quick lookup and revocation
  @Column({ type: 'varchar', length: 36, unique: true })
  jti: string;

  // Token expiration time (should match JWT exp claim)
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  // Revocation flag - once revoked, token cannot be used
  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  isRevoked: boolean;

  // Track when token was revoked for audit purposes
  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date;

  // When the token was created
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Track last use for detecting replay attacks
  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  // Optional device/user agent info for security tracking
  @Column({ name: 'device_info', type: 'text', nullable: true })
  deviceInfo: string;
}
