// Tests for src/features/auth/domain/usecases/UpdatePasswordUseCase.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { UpdatePasswordUseCase } from '@/features/auth/domain/usecases/UpdatePasswordUseCase';
import { createMockAuthRepository } from '@tests/helpers/mocks';
import { UpdatePasswordCredentials } from '@/features/auth/domain/entities/AuthCredentials';

describe('UpdatePasswordUseCase', () => {
  let useCase: UpdatePasswordUseCase;
  let mockRepository: ReturnType<typeof createMockAuthRepository>;

  beforeEach(() => {
    mockRepository = createMockAuthRepository();
    useCase = new UpdatePasswordUseCase(mockRepository);
  });

  describe('password validation', () => {
    it('should return WEAK_PASSWORD when password is empty', async () => {
      const credentials: UpdatePasswordCredentials = { newPassword: '' };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEAK_PASSWORD');
      }
      expect(mockRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('should return WEAK_PASSWORD when password is less than 8 characters', async () => {
      const credentials: UpdatePasswordCredentials = { newPassword: '1234567' };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEAK_PASSWORD');
      }
      expect(mockRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('should return WEAK_PASSWORD when password is undefined', async () => {
      const credentials = { newPassword: undefined as any };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEAK_PASSWORD');
      }
    });
  });

  describe('successful update', () => {
    it('should call repository updatePassword with valid 8-char password', async () => {
      const credentials: UpdatePasswordCredentials = { newPassword: '12345678' };

      mockRepository.updatePassword.mockResolvedValue({ success: true });

      const result = await useCase.execute(credentials);

      expect(mockRepository.updatePassword).toHaveBeenCalledWith(credentials);
      expect(result.success).toBe(true);
    });

    it('should call repository updatePassword with strong password', async () => {
      const credentials: UpdatePasswordCredentials = { newPassword: 'MyStr0ng!P@ssw0rd' };

      mockRepository.updatePassword.mockResolvedValue({ success: true });

      const result = await useCase.execute(credentials);

      expect(mockRepository.updatePassword).toHaveBeenCalledWith(credentials);
      expect(result.success).toBe(true);
    });
  });
});
