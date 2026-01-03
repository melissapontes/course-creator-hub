// Cart Repository Implementation
// Implements ICartRepository using SupabaseCartDataSource

import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { SupabaseCartDataSource } from '../datasources/SupabaseCartDataSource';
import { CartItem } from '../../domain/entities';

export class CartRepositoryImpl implements ICartRepository {
  constructor(private readonly dataSource: SupabaseCartDataSource) {}

  async getCartItems(userId: string): Promise<CartItem[]> {
    return this.dataSource.getCartItems(userId);
  }

  async addToCart(userId: string, courseId: string): Promise<void> {
    return this.dataSource.addToCart(userId, courseId);
  }

  async removeFromCart(userId: string, courseId: string): Promise<void> {
    return this.dataSource.removeFromCart(userId, courseId);
  }

  async clearCart(userId: string): Promise<void> {
    return this.dataSource.clearCart(userId);
  }

  async isInCart(userId: string, courseId: string): Promise<boolean> {
    return this.dataSource.isInCart(userId, courseId);
  }

  async getEnrolledCourseIds(userId: string): Promise<string[]> {
    return this.dataSource.getEnrolledCourseIds(userId);
  }
}
