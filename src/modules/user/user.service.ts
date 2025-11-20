import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

/**
 * User service
 * Handles user-related operations
 * Note: In this simplified system, users are created automatically during auth
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Find user by name and type
   */
  async findByNameAndType(name: string, type: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { name, type: type as any },
    });
  }

  /**
   * Check if user is active
   */
  async isUserActive(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    return user.isActive;
  }
}
