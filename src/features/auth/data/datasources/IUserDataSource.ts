// Data Source Interface: IUserDataSource
// Defines the contract for user data operations

import { AppRole, UserStatus } from '../../domain/entities/User';

export interface UserProfileRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: UserStatus;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  role: AppRole;
}

export interface UpdateProfileParams {
  fullName: string;
  avatarUrl?: string;
}

export interface IUserDataSource {
  getProfileById(userId: string): Promise<{ data: UserProfileRow | null; error: Error | null }>;
  getRoleByUserId(userId: string): Promise<{ data: UserRoleRow | null; error: Error | null }>;
  updateProfile(
    userId: string,
    params: UpdateProfileParams
  ): Promise<{ error: Error | null }>;
  uploadAvatar(
    userId: string,
    file: File
  ): Promise<{ url: string | null; error: Error | null }>;
}
