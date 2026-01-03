// Tests for src/features/cart/domain/usecases/GetCartSummaryUseCase.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GetCartSummaryUseCase } from '@/features/cart/domain/usecases/GetCartSummaryUseCase';
import { createMockCartRepository } from '@tests/helpers/mocks';
import { createMockCartItem, createMockCartItems } from '@tests/helpers/factories';

describe('GetCartSummaryUseCase', () => {
  let useCase: GetCartSummaryUseCase;
  let mockRepository: ReturnType<typeof createMockCartRepository>;

  beforeEach(() => {
    mockRepository = createMockCartRepository();
    useCase = new GetCartSummaryUseCase(mockRepository);
  });

  describe('empty cart', () => {
    it('should return empty summary for empty cart', async () => {
      mockRepository.getCartItems.mockResolvedValue([]);

      const result = await useCase.execute('user-123');

      expect(result.items).toEqual([]);
      expect(result.itemCount).toBe(0);
      expect(result.subtotal).toBe(0);
    });
  });

  describe('cart with items', () => {
    it('should return correct item count', async () => {
      const mockItems = createMockCartItems(3);
      mockRepository.getCartItems.mockResolvedValue(mockItems);

      const result = await useCase.execute('user-123');

      expect(result.itemCount).toBe(3);
    });

    it('should calculate correct subtotal', async () => {
      const mockItems = [
        createMockCartItem({ course: { id: '1', title: 'Course 1', subtitle: null, thumbnailUrl: null, price: 50, instructorId: '1' } }),
        createMockCartItem({ course: { id: '2', title: 'Course 2', subtitle: null, thumbnailUrl: null, price: 75.50, instructorId: '1' } }),
        createMockCartItem({ course: { id: '3', title: 'Course 3', subtitle: null, thumbnailUrl: null, price: 100, instructorId: '1' } }),
      ];
      mockRepository.getCartItems.mockResolvedValue(mockItems);

      const result = await useCase.execute('user-123');

      expect(result.subtotal).toBe(225.50);
    });

    it('should handle courses with zero price', async () => {
      const mockItems = [
        createMockCartItem({ course: { id: '1', title: 'Free Course', subtitle: null, thumbnailUrl: null, price: 0, instructorId: '1' } }),
        createMockCartItem({ course: { id: '2', title: 'Paid Course', subtitle: null, thumbnailUrl: null, price: 50, instructorId: '1' } }),
      ];
      mockRepository.getCartItems.mockResolvedValue(mockItems);

      const result = await useCase.execute('user-123');

      expect(result.subtotal).toBe(50);
      expect(result.itemCount).toBe(2);
    });

    it('should handle null price as zero', async () => {
      const mockItems = [
        createMockCartItem({ course: { id: '1', title: 'Course 1', subtitle: null, thumbnailUrl: null, price: null as any, instructorId: '1' } }),
        createMockCartItem({ course: { id: '2', title: 'Course 2', subtitle: null, thumbnailUrl: null, price: 100, instructorId: '1' } }),
      ];
      mockRepository.getCartItems.mockResolvedValue(mockItems);

      const result = await useCase.execute('user-123');

      expect(result.subtotal).toBe(100);
    });

    it('should return all items in the summary', async () => {
      const mockItems = createMockCartItems(5);
      mockRepository.getCartItems.mockResolvedValue(mockItems);

      const result = await useCase.execute('user-123');

      expect(result.items).toHaveLength(5);
      expect(result.items).toEqual(mockItems);
    });
  });

  describe('repository interaction', () => {
    it('should call repository with correct user ID', async () => {
      mockRepository.getCartItems.mockResolvedValue([]);

      await useCase.execute('specific-user-id');

      expect(mockRepository.getCartItems).toHaveBeenCalledWith('specific-user-id');
      expect(mockRepository.getCartItems).toHaveBeenCalledTimes(1);
    });
  });

  describe('precision handling', () => {
    it('should handle decimal prices correctly', async () => {
      const mockItems = [
        createMockCartItem({ course: { id: '1', title: 'Course 1', subtitle: null, thumbnailUrl: null, price: 19.99, instructorId: '1' } }),
        createMockCartItem({ course: { id: '2', title: 'Course 2', subtitle: null, thumbnailUrl: null, price: 29.99, instructorId: '1' } }),
        createMockCartItem({ course: { id: '3', title: 'Course 3', subtitle: null, thumbnailUrl: null, price: 49.99, instructorId: '1' } }),
      ];
      mockRepository.getCartItems.mockResolvedValue(mockItems);

      const result = await useCase.execute('user-123');

      // Note: JavaScript floating point: 19.99 + 29.99 + 49.99 = 99.97
      expect(result.subtotal).toBeCloseTo(99.97, 2);
    });
  });
});
