// Tests for src/features/auth/domain/entities/AuthResult.ts
import { describe, it, expect } from 'vitest';
import { createAuthError, AuthErrorCode } from '@/features/auth/domain/entities/AuthResult';

describe('createAuthError', () => {
  describe('default messages', () => {
    it('should create error with INVALID_CREDENTIALS default message', () => {
      const error = createAuthError('INVALID_CREDENTIALS');
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.message).toBe('Email ou senha incorretos');
    });

    it('should create error with EMAIL_NOT_CONFIRMED default message', () => {
      const error = createAuthError('EMAIL_NOT_CONFIRMED');
      expect(error.code).toBe('EMAIL_NOT_CONFIRMED');
      expect(error.message).toBe('Por favor, confirme seu email antes de fazer login');
    });

    it('should create error with USER_ALREADY_EXISTS default message', () => {
      const error = createAuthError('USER_ALREADY_EXISTS');
      expect(error.code).toBe('USER_ALREADY_EXISTS');
      expect(error.message).toBe('Este email já está cadastrado');
    });

    it('should create error with WEAK_PASSWORD default message', () => {
      const error = createAuthError('WEAK_PASSWORD');
      expect(error.code).toBe('WEAK_PASSWORD');
      expect(error.message).toBe('Senha muito fraca. Use pelo menos 8 caracteres');
    });

    it('should create error with INVALID_EMAIL default message', () => {
      const error = createAuthError('INVALID_EMAIL');
      expect(error.code).toBe('INVALID_EMAIL');
      expect(error.message).toBe('Email inválido');
    });

    it('should create error with NOT_AUTHENTICATED default message', () => {
      const error = createAuthError('NOT_AUTHENTICATED');
      expect(error.code).toBe('NOT_AUTHENTICATED');
      expect(error.message).toBe('Você precisa estar autenticado para realizar esta ação');
    });

    it('should create error with ADMIN_SIGNUP_FORBIDDEN default message', () => {
      const error = createAuthError('ADMIN_SIGNUP_FORBIDDEN');
      expect(error.code).toBe('ADMIN_SIGNUP_FORBIDDEN');
      expect(error.message).toBe('Não é possível criar conta de administrador');
    });

    it('should create error with NETWORK_ERROR default message', () => {
      const error = createAuthError('NETWORK_ERROR');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Erro de conexão. Verifique sua internet');
    });

    it('should create error with UNKNOWN_ERROR default message', () => {
      const error = createAuthError('UNKNOWN_ERROR');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe('Ocorreu um erro inesperado');
    });
  });

  describe('custom messages', () => {
    it('should override default message with custom message', () => {
      const customMessage = 'Custom error message';
      const error = createAuthError('INVALID_CREDENTIALS', customMessage);
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.message).toBe(customMessage);
    });

    it('should use custom message for any error code', () => {
      const customMessage = 'Specific validation error';
      const error = createAuthError('UNKNOWN_ERROR', customMessage);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe(customMessage);
    });
  });

  describe('error structure', () => {
    it('should return object with code and message properties', () => {
      const error = createAuthError('INVALID_EMAIL');
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(typeof error.code).toBe('string');
      expect(typeof error.message).toBe('string');
    });
  });
});
