/**
 * @fileoverview Use Case de Login
 * @module features/auth/domain/usecases/SignInUseCase
 * 
 * Responsabilidade única: executar a lógica de autenticação do usuário,
 * incluindo validação de credenciais e delegação ao repositório.
 */

import { IAuthRepository } from '../repositories/IAuthRepository';
import { LoginCredentials, AuthResult, createAuthError } from '../entities';

export class SignInUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthResult> {
    // Validate input
    if (!credentials.email || !credentials.email.includes('@')) {
      return { success: false, error: createAuthError('INVALID_EMAIL') };
    }

    if (!credentials.password) {
      return { success: false, error: createAuthError('INVALID_CREDENTIALS') };
    }

    // Execute sign in
    return this.authRepository.signIn(credentials);
  }
}
