// Dependency Injection Container for Cart Feature

import { ICartRepository } from '../domain/repositories';
import { GetCartSummaryUseCase, AddToCartUseCase, CheckoutUseCase } from '../domain/usecases';
import { SupabaseCartDataSource } from '../data/datasources';
import { CartRepositoryImpl } from '../data/repositories';
import { getEnrollmentRepository } from '@/features/courses/di';

// Singleton instances
let cartDataSource: SupabaseCartDataSource | null = null;
let cartRepository: ICartRepository | null = null;

// Data Sources
function getCartDataSource(): SupabaseCartDataSource {
  if (!cartDataSource) {
    cartDataSource = new SupabaseCartDataSource();
  }
  return cartDataSource;
}

// Repositories
export function getCartRepository(): ICartRepository {
  if (!cartRepository) {
    cartRepository = new CartRepositoryImpl(getCartDataSource());
  }
  return cartRepository;
}

// Use Cases Factory
export function createGetCartSummaryUseCase(): GetCartSummaryUseCase {
  return new GetCartSummaryUseCase(getCartRepository());
}

export function createAddToCartUseCase(): AddToCartUseCase {
  return new AddToCartUseCase(getCartRepository());
}

export function createCheckoutUseCase(): CheckoutUseCase {
  const enrollmentRepo = getEnrollmentRepository();
  return new CheckoutUseCase(
    getCartRepository(),
    (enrollments) => enrollmentRepo.createEnrollments(enrollments)
  );
}

// Reset function for testing
export function resetCartContainer(): void {
  cartDataSource = null;
  cartRepository = null;
}
