// Use Case: Update Profile
// Single responsibility: handle user profile updates

import { IUserRepository } from '../repositories/IUserRepository';
import { UpdateProfileData, AuthResult, createAuthError } from '../entities';

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    userId: string,
    data: UpdateProfileData,
    avatarFile?: File
  ): Promise<AuthResult> {
    // Validate full name
    if (!data.fullName || data.fullName.trim().length < 2) {
      return {
        success: false,
        error: createAuthError('UNKNOWN_ERROR', 'Nome deve ter pelo menos 2 caracteres'),
      };
    }

    if (data.fullName.length > 100) {
      return {
        success: false,
        error: createAuthError('UNKNOWN_ERROR', 'Nome deve ter no máximo 100 caracteres'),
      };
    }

    let avatarUrl = data.avatarUrl;

    // Upload avatar if provided
    if (avatarFile) {
      // Validate file size (5MB max)
      if (avatarFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          error: createAuthError('UNKNOWN_ERROR', 'A imagem deve ter no máximo 5MB'),
        };
      }

      const { url, error } = await this.userRepository.uploadAvatar(userId, avatarFile);
      if (error) {
        return { success: false, error: createAuthError('UNKNOWN_ERROR', error) };
      }
      avatarUrl = url || undefined;
    }

    return this.userRepository.updateProfile(userId, {
      fullName: data.fullName.trim(),
      avatarUrl,
    });
  }
}
