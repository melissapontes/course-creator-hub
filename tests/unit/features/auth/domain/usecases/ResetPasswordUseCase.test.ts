// Tests for src/features/auth/domain/usecases/ResetPasswordUseCase.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ResetPasswordUseCase } from '@/features/auth/domain/usecases/ResetPasswordUseCase';
import { createMockAuthRepository } from '@tests/helpers/mocks';
import { ResetPasswordCredentials } from '@/features/auth/domain/entities/AuthCredentials';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockRepository: ReturnType<typeof createMockAuthRepository>;

  beforeEach(() => {
    mockRepository = createMockAuthRepository();
    useCase = new ResetPasswordUseCase(mockRepository);
  });

  describe('email validation', () => {
    it('should return INVALID_EMAIL when email is empty', async () => {
      const credentials: ResetPasswordCredentials = { email: '' };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
      expect(mockRepository.resetPassword).not.toHaveBeenCalled();
    });

    it('should return INVALID_EMAIL when email lacks @', async () => {
      const credentials: ResetPasswordCredentials = { email: 'invalidemail.com' };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
      expect(mockRepository.resetPassword).not.toHaveBeenCalled();
    });

    it('should return INVALID_EMAIL when email is undefined', async () => {
      const credentials = { email: undefined as any };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });
  });

  describe('successful reset', () => {
    it('should call repository resetPassword with valid email', async () => {
      const credentials: ResetPasswordCredentials = { email: 'test@example.com' };

      mockRepository.resetPassword.mockResolvedValue({ success: true });

      const result = await useCase.execute(credentials);

      expect(mockRepository.resetPassword).toHaveBeenCalledWith(credentials);
      expect(result.success).toBe(true);
    });

    it('should accept email with subdomain', async () => {
      const credentials: ResetPasswordCredentials = { email: 'user@mail.example.com' };

      mockRepository.resetPassword.mockResolvedValue({ success: true });

      await useCase.execute(credentials);

      expect(mockRepository.resetPassword).toHaveBeenCalled();
    });
  });
});
