// Use Case: Sign Out
// Single responsibility: handle user sign out logic

import { IAuthRepository } from '../repositories/IAuthRepository';
import { AuthResult } from '../entities';

export class SignOutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<AuthResult> {
    return this.authRepository.signOut();
  }
}
