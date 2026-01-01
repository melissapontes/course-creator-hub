import { PostgrestError, AuthError } from '@supabase/supabase-js';

export type AppError = {
  message: string;
  code?: string;
  status?: number;
};

export function mapSupabaseError(error: PostgrestError | AuthError | null): AppError | null {
  if (!error) return null;

  // Auth errors
  if ('status' in error) {
    const authError = error as AuthError;
    
    switch (authError.message) {
      case 'Invalid login credentials':
        return { message: 'E-mail ou senha incorretos', code: 'INVALID_CREDENTIALS', status: 401 };
      case 'Email not confirmed':
        return { message: 'Por favor, confirme seu e-mail antes de fazer login', code: 'EMAIL_NOT_CONFIRMED', status: 403 };
      case 'User already registered':
        return { message: 'Este e-mail já está cadastrado', code: 'USER_EXISTS', status: 409 };
      case 'Password should be at least 6 characters':
        return { message: 'A senha deve ter pelo menos 6 caracteres', code: 'WEAK_PASSWORD', status: 400 };
      default:
        return { message: authError.message || 'Erro de autenticação', code: 'AUTH_ERROR', status: authError.status };
    }
  }

  // Postgres errors
  const pgError = error as PostgrestError;
  
  switch (pgError.code) {
    case '23505':
      return { message: 'Este registro já existe', code: 'DUPLICATE', status: 409 };
    case '23503':
      return { message: 'Referência inválida', code: 'FOREIGN_KEY', status: 400 };
    case '42501':
      return { message: 'Você não tem permissão para esta ação', code: 'FORBIDDEN', status: 403 };
    case 'PGRST116':
      return { message: 'Registro não encontrado', code: 'NOT_FOUND', status: 404 };
    default:
      return { message: pgError.message || 'Erro no servidor', code: pgError.code, status: 500 };
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Ocorreu um erro inesperado';
}
