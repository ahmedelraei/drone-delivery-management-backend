import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { UserType } from '../../../common/enums/index';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Order } from '../../order/entities/order.entity';

/**
 * User entity
 * Represents all actors in the system: admins, end users, and drones
 * Each has different permissions and capabilities
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User's name (used for authentication in this simplified system)
  @Column({ type: 'varchar', length: 255 })
  name: string;

  // Type determines what operations the user can perform
  @Column({
    type: 'enum',
    enum: UserType,
  })
  type: UserType;

  // Track when the user was created
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Track last login for security monitoring
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // Allow deactivation without deletion (soft delete alternative)
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relationships
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
