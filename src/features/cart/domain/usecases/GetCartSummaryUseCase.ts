// Use Case: Get Cart Summary
// Fetches cart items and calculates totals

import { ICartRepository } from '../repositories/ICartRepository';
import { CartSummary } from '../entities';

export class GetCartSummaryUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  async execute(userId: string): Promise<CartSummary> {
    const items = await this.cartRepository.getCartItems(userId);
    const subtotal = items.reduce((sum, item) => sum + (item.course.price || 0), 0);

    return {
      items,
      itemCount: items.length,
      subtotal,
    };
  }
}
