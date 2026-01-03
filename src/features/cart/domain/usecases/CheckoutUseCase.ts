// Use Case: Checkout
// Processes the checkout and creates enrollments

import { ICartRepository } from '../repositories/ICartRepository';
import { CartItem } from '../entities';

export interface CheckoutResult {
  success: boolean;
  error?: string;
}

export class CheckoutUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly createEnrollments: (enrollments: { userId: string; courseId: string }[]) => Promise<void>
  ) {}

  async execute(userId: string, cartItems: CartItem[]): Promise<CheckoutResult> {
    if (cartItems.length === 0) {
      return { success: false, error: 'Seu carrinho está vazio' };
    }

    try {
      // Create enrollments
      const enrollments = cartItems.map((item) => ({
        userId,
        courseId: item.courseId,
      }));

      await this.createEnrollments(enrollments);

      // Clear cart
      await this.cartRepository.clearCart(userId);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: 'Erro ao processar compra. Tente novamente.' };
    }
  }
}
