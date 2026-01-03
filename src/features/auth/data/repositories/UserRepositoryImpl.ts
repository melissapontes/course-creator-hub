// User Repository Implementation
// Implements IUserRepository using IUserDataSource

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IUserDataSource } from '../datasources/IUserDataSource';
import {
  AuthenticatedUser,
  UpdateProfileData,
  AuthResult,
  createAuthError,
  AppRole,
} from '../../domain/entities';

export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly userDataSource: IUserDataSource) {}

  async getUserById(userId: string, email: string): Promise<AuthenticatedUser | null> {
    const { data: profile, error: profileError } = await this.userDataSource.getProfileById(userId);

    if (profileError || !profile) {
      return null;
    }

    const { data: roleData } = await this.userDataSource.getRoleByUserId(userId);
    const role = (roleData?.role || profile.role) as AppRole;

    return {
      id: userId,
      email,
      role,
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        avatarUrl: profile.avatar_url,
        status: profile.status,
        role: profile.role,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
    };
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<AuthResult> {
    const { error } = await this.userDataSource.updateProfile(userId, {
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
    });

    if (error) {
      return { success: false, error: createAuthError('UNKNOWN_ERROR', error.message) };
    }

    return { success: true };
  }

  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{ url: string | null; error: string | null }> {
    const { url, error } = await this.userDataSource.uploadAvatar(userId, file);
    return { url, error: error?.message || null };
  }
}
