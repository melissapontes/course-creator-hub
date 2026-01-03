// Domain Repository Interface: IAuthRepository
// Defines the contract for authentication operations
// This interface MUST NOT depend on any implementation details

import {
  AuthenticatedUser,
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  UpdatePasswordCredentials,
  AuthResult,
} from '../entities';

export interface IAuthRepository {
  /**
   * Sign in with email and password
   */
  signIn(credentials: LoginCredentials): Promise<AuthResult>;

  /**
   * Register a new user
   */
  signUp(credentials: RegisterCredentials): Promise<AuthResult>;

  /**
   * Sign out the current user
   */
  signOut(): Promise<AuthResult>;

  /**
   * Send password reset email
   */
  resetPassword(credentials: ResetPasswordCredentials): Promise<AuthResult>;

  /**
   * Update password for authenticated user
   */
  updatePassword(credentials: UpdatePasswordCredentials): Promise<AuthResult>;

  /**
   * Get current session
   */
  getSession(): Promise<{ user: AuthenticatedUser | null; session: AuthSession | null }>;

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (user: AuthenticatedUser | null, session: AuthSession | null) => void
  ): () => void;
}
