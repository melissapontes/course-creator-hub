// Tests for src/features/auth/domain/usecases/SignUpUseCase.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SignUpUseCase } from '@/features/auth/domain/usecases/SignUpUseCase';
import { createMockAuthRepository } from '@tests/helpers/mocks';
import { createMockUser, createMockSession } from '@tests/helpers/factories';
import { RegisterCredentials } from '@/features/auth/domain/entities/AuthCredentials';

describe('SignUpUseCase', () => {
  let useCase: SignUpUseCase;
  let mockRepository: ReturnType<typeof createMockAuthRepository>;

  beforeEach(() => {
    mockRepository = createMockAuthRepository();
    useCase = new SignUpUseCase(mockRepository);
  });

  describe('business rules', () => {
    it('should reject ADMIN role registration', async () => {
      const credentials = {
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin User',
        role: 'ADMIN' as any,
      };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ADMIN_SIGNUP_FORBIDDEN');
      }
      expect(mockRepository.signUp).not.toHaveBeenCalled();
    });
  });

  describe('email validation', () => {
    it('should return INVALID_EMAIL when email is empty', async () => {
      const credentials: RegisterCredentials = {
        email: '',
        password: 'password123',
        fullName: 'Test User',
        role: 'ESTUDANTE',
      };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('should return INVALID_EMAIL when email lacks @', async () => {
      const credentials: RegisterCredentials = {
        email: 'invalidemail.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'ESTUDANTE',
      };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });
  });

  describe('password validation', () => {
    it('should return WEAK_PASSWORD when password is empty', async () => {
      const credentials: RegisterCredentials = {
        email: 'test@example.com',
        password: '',
        fullName: 'Test User',
        role: 'ESTUDANTE',
      };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEAK_PASSWORD');
      }
    });

    it('should return WEAK_PASSWORD when password is less than 8 characters', async () => {
      const credentials: RegisterCredentials = {
        email: 'test@example.com',
        password: '1234567',
        fullName: 'Test User',
        role: 'ESTUDANTE',
      };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEAK_PASSWORD');
      }
    });

    it('should accept password with exactly 8 characters', async () => {
      const credentials: RegisterCredentials = {
        email: 'test@example.com',
        password: '12345678',
        fullName: 'Test User',
        role: 'ESTUDANTE',
      };

      mockRepository.signUp.mockResolvedValue({ success: true });

      await useCase.execute(credentials);

      expect(mockRepository.signUp).toHaveBeenCalled();
    });
  });

  describe('name validation', () => {
    it('should return error when fullName is empty', async () => {
      const credentials: RegisterCredentials = {
        email: 'test@example.com',
        password: 'password123',
        fullName: '',
        role: 'ESTUDANTE',
      };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toContain('2 caracteres');
      }
    });

    it('should return error when fullName has only 1 character', async () => {
      const credentials: RegisterCredentials = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'A',
        role: 'ESTUDANTE',
      };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
    });

    it('should return error when fullName is only whitespace', async () => {
      const credentials: RegisterCredentials = {
        email: 'test@example.com',
        password: 'password123',
        fullName: '   ',
        role: 'ESTUDANTE',
      };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
    });

    it('should accept fullName with exactly 2 characters', async () => {
      const credentials: RegisterCredentials = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'AB',
        role: 'ESTUDANTE',
      };

      mockRepository.signUp.mockResolvedValue({ success: true });

      await useCase.execute(credentials);

      expect(mockRepository.signUp).toHaveBeenCalled();
    });
  });

  describe('successful registration', () => {
    it('should call repository signUp with valid ESTUDANTE credentials', async () => {
      const credentials: RegisterCredentials = {
        email: 'student@example.com',
        password: 'password123',
        fullName: 'Test Student',
        role: 'ESTUDANTE',
      };

      mockRepository.signUp.mockResolvedValue({ success: true });

      const result = await useCase.execute(credentials);

      expect(mockRepository.signUp).toHaveBeenCalledWith(credentials);
      expect(result.success).toBe(true);
    });

    it('should call repository signUp with valid PROFESSOR credentials', async () => {
      const credentials: RegisterCredentials = {
        email: 'professor@example.com',
        password: 'password123',
        fullName: 'Test Professor',
        role: 'PROFESSOR',
      };

      mockRepository.signUp.mockResolvedValue({ success: true });

      const result = await useCase.execute(credentials);

      expect(mockRepository.signUp).toHaveBeenCalledWith(credentials);
      expect(result.success).toBe(true);
    });
  });

  describe('repository errors', () => {
    it('should propagate USER_ALREADY_EXISTS error', async () => {
      const credentials: RegisterCredentials = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'ESTUDANTE',
      };

      mockRepository.signUp.mockResolvedValue({
        success: false,
        error: { code: 'USER_ALREADY_EXISTS', message: 'Este email já está cadastrado' },
      });

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_ALREADY_EXISTS');
      }
    });
  });
});
