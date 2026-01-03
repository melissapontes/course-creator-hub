// Domain Repository Interface: ICartRepository
// Defines the contract for cart operations

import { CartItem, CartSummary } from '../entities';

export interface ICartRepository {
  getCartItems(userId: string): Promise<CartItem[]>;
  addToCart(userId: string, courseId: string): Promise<void>;
  removeFromCart(userId: string, courseId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  isInCart(userId: string, courseId: string): Promise<boolean>;
  getEnrolledCourseIds(userId: string): Promise<string[]>;
}
