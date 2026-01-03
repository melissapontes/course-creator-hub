// Use Case: Update Password
// Single responsibility: handle password update for authenticated user

import { IAuthRepository } from '../repositories/IAuthRepository';
import { UpdatePasswordCredentials, AuthResult, createAuthError } from '../entities';

export class UpdatePasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(credentials: UpdatePasswordCredentials): Promise<AuthResult> {
    // Validate password strength
    if (!credentials.newPassword || credentials.newPassword.length < 8) {
      return { success: false, error: createAuthError('WEAK_PASSWORD') };
    }

    return this.authRepository.updatePassword(credentials);
  }
}
