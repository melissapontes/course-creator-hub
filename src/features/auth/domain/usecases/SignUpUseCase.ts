// Use Case: Sign Up
// Single responsibility: handle user registration logic

import { IAuthRepository } from '../repositories/IAuthRepository';
import { RegisterCredentials, AuthResult, createAuthError } from '../entities';

export class SignUpUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(credentials: RegisterCredentials): Promise<AuthResult> {
    // Business rule: ADMIN cannot be self-registered
    if ((credentials.role as string) === 'ADMIN') {
      return { success: false, error: createAuthError('ADMIN_SIGNUP_FORBIDDEN') };
    }

    // Validate input
    if (!credentials.email || !credentials.email.includes('@')) {
      return { success: false, error: createAuthError('INVALID_EMAIL') };
    }

    if (!credentials.password || credentials.password.length < 8) {
      return { success: false, error: createAuthError('WEAK_PASSWORD') };
    }

    if (!credentials.fullName || credentials.fullName.trim().length < 2) {
      return { 
        success: false, 
        error: createAuthError('UNKNOWN_ERROR', 'Nome deve ter pelo menos 2 caracteres') 
      };
    }

    // Execute sign up
    return this.authRepository.signUp(credentials);
  }
}
