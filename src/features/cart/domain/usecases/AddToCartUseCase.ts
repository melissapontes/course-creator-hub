// Use Case: Add To Cart
// Adds a course to the shopping cart

import { ICartRepository } from '../repositories/ICartRepository';

export class AddToCartUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  async execute(userId: string, courseId: string): Promise<{ success: boolean; error?: string }> {
    // Check if already enrolled
    const enrolledIds = await this.cartRepository.getEnrolledCourseIds(userId);
    if (enrolledIds.includes(courseId)) {
      return { success: false, error: 'Você já possui este curso' };
    }

    try {
      await this.cartRepository.addToCart(userId, courseId);
      return { success: true };
    } catch (error: any) {
      if (error.code === '23505') {
        return { success: false, error: 'Curso já está no carrinho' };
      }
      return { success: false, error: 'Erro ao adicionar ao carrinho' };
    }
  }
}
