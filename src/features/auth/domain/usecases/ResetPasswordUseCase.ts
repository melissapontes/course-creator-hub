// Use Case: Reset Password
// Single responsibility: handle password reset request

import { IAuthRepository } from '../repositories/IAuthRepository';
import { ResetPasswordCredentials, AuthResult, createAuthError } from '../entities';

export class ResetPasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(credentials: ResetPasswordCredentials): Promise<AuthResult> {
    // Validate email
    if (!credentials.email || !credentials.email.includes('@')) {
      return { success: false, error: createAuthError('INVALID_EMAIL') };
    }

    return this.authRepository.resetPassword(credentials);
  }
}
