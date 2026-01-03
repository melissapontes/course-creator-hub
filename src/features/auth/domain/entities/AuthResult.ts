// Domain Entity: Authentication Results
// Result types for auth operations

import { AuthenticatedUser, AuthSession } from './User';

export interface AuthResultBase {
  success: boolean;
  error?: AuthError;
}

export interface AuthSuccessResult extends AuthResultBase {
  success: true;
  user?: AuthenticatedUser;
  session?: AuthSession;
}

export interface AuthFailureResult extends AuthResultBase {
  success: false;
  error: AuthError;
}

export type AuthResult = AuthSuccessResult | AuthFailureResult;

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'USER_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'NOT_AUTHENTICATED'
  | 'ADMIN_SIGNUP_FORBIDDEN'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export function createAuthError(code: AuthErrorCode, message?: string): AuthError {
  const defaultMessages: Record<AuthErrorCode, string> = {
    INVALID_CREDENTIALS: 'Email ou senha incorretos',
    EMAIL_NOT_CONFIRMED: 'Por favor, confirme seu email antes de fazer login',
    USER_ALREADY_EXISTS: 'Este email já está cadastrado',
    WEAK_PASSWORD: 'Senha muito fraca. Use pelo menos 8 caracteres',
    INVALID_EMAIL: 'Email inválido',
    NOT_AUTHENTICATED: 'Você precisa estar autenticado para realizar esta ação',
    ADMIN_SIGNUP_FORBIDDEN: 'Não é possível criar conta de administrador',
    NETWORK_ERROR: 'Erro de conexão. Verifique sua internet',
    UNKNOWN_ERROR: 'Ocorreu um erro inesperado',
  };

  return {
    code,
    message: message || defaultMessages[code],
  };
}
