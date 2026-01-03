// Tests for src/features/auth/domain/usecases/SignInUseCase.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SignInUseCase } from '@/features/auth/domain/usecases/SignInUseCase';
import { createMockAuthRepository, createSuccessResult } from '@tests/helpers/mocks';
import { createMockUser, createMockSession } from '@tests/helpers/factories';
import { LoginCredentials } from '@/features/auth/domain/entities/AuthCredentials';

describe('SignInUseCase', () => {
  let useCase: SignInUseCase;
  let mockRepository: ReturnType<typeof createMockAuthRepository>;

  beforeEach(() => {
    mockRepository = createMockAuthRepository();
    useCase = new SignInUseCase(mockRepository);
  });

  describe('validation', () => {
    it('should return INVALID_EMAIL error when email is empty', async () => {
      const credentials: LoginCredentials = { email: '', password: 'password123' };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
      expect(mockRepository.signIn).not.toHaveBeenCalled();
    });

    it('should return INVALID_EMAIL error when email lacks @', async () => {
      const credentials: LoginCredentials = { email: 'invalidemail.com', password: 'password123' };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
      expect(mockRepository.signIn).not.toHaveBeenCalled();
    });

    it('should return INVALID_CREDENTIALS error when password is empty', async () => {
      const credentials: LoginCredentials = { email: 'test@example.com', password: '' };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CREDENTIALS');
      }
      expect(mockRepository.signIn).not.toHaveBeenCalled();
    });

    it('should return INVALID_EMAIL when email is undefined', async () => {
      const credentials = { email: undefined as any, password: 'password123' };

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });
  });

  describe('successful sign in', () => {
    it('should call repository signIn with valid credentials', async () => {
      const credentials: LoginCredentials = { 
        email: 'test@example.com', 
        password: 'password123' 
      };
      const mockUser = createMockUser();
      const mockSession = createMockSession();
      
      mockRepository.signIn.mockResolvedValue({
        success: true,
        user: mockUser,
        session: mockSession,
      });

      const result = await useCase.execute(credentials);

      expect(mockRepository.signIn).toHaveBeenCalledWith(credentials);
      expect(mockRepository.signIn).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should return user and session on success', async () => {
      const credentials: LoginCredentials = { 
        email: 'test@example.com', 
        password: 'password123' 
      };
      const mockUser = createMockUser({ email: 'test@example.com' });
      const mockSession = createMockSession();
      
      mockRepository.signIn.mockResolvedValue({
        success: true,
        user: mockUser,
        session: mockSession,
      });

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(mockUser);
        expect(result.session).toEqual(mockSession);
      }
    });
  });

  describe('failed sign in', () => {
    it('should propagate repository errors', async () => {
      const credentials: LoginCredentials = { 
        email: 'test@example.com', 
        password: 'wrongpassword' 
      };
      
      mockRepository.signIn.mockResolvedValue({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Email ou senha incorretos' },
      });

      const result = await useCase.execute(credentials);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CREDENTIALS');
      }
    });
  });
});
