// Domain Repository Interface: IUserRepository
// Defines the contract for user profile operations
// This interface MUST NOT depend on any implementation details

import { AuthenticatedUser, UpdateProfileData, AuthResult } from '../entities';

export interface IUserRepository {
  /**
   * Fetch user data by ID
   */
  getUserById(userId: string, email: string): Promise<AuthenticatedUser | null>;

  /**
   * Update user profile
   */
  updateProfile(userId: string, data: UpdateProfileData): Promise<AuthResult>;

  /**
   * Upload user avatar and return the URL
   */
  uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: string | null }>;
}
