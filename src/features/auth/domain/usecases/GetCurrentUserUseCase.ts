// Use Case: Get Current User
// Single responsibility: retrieve current authenticated user

import { IAuthRepository } from '../repositories/IAuthRepository';
import { AuthenticatedUser, AuthSession } from '../entities';

export class GetCurrentUserUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<{ user: AuthenticatedUser | null; session: AuthSession | null }> {
    return this.authRepository.getSession();
  }
}
