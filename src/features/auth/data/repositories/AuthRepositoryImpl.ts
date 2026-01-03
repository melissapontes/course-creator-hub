// Auth Repository Implementation
// Implements IAuthRepository using IAuthDataSource and IUserDataSource

import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IAuthDataSource } from '../datasources/IAuthDataSource';
import { IUserDataSource } from '../datasources/IUserDataSource';
import {
  AuthenticatedUser,
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  UpdatePasswordCredentials,
  AuthResult,
  createAuthError,
  AppRole,
} from '../../domain/entities';

export class AuthRepositoryImpl implements IAuthRepository {
  constructor(
    private readonly authDataSource: IAuthDataSource,
    private readonly userDataSource: IUserDataSource
  ) {}

  async signIn(credentials: LoginCredentials): Promise<AuthResult> {
    const result = await this.authDataSource.signIn({
      email: credentials.email,
      password: credentials.password,
    });

    if (result.error) {
      return this.mapError(result.error);
    }

    if (!result.user || !result.session) {
      return { success: false, error: createAuthError('UNKNOWN_ERROR') };
    }

    const authUser = await this.fetchUserData(result.user.id, result.user.email || '');
    if (!authUser) {
      return { success: false, error: createAuthError('UNKNOWN_ERROR') };
    }

    return {
      success: true,
      user: authUser,
      session: this.mapSession(result.session),
    };
  }

  async signUp(credentials: RegisterCredentials): Promise<AuthResult> {
    const redirectUrl = `${window.location.origin}/`;

    const result = await this.authDataSource.signUp({
      email: credentials.email,
      password: credentials.password,
      fullName: credentials.fullName,
      role: credentials.role,
      redirectUrl,
    });

    if (result.error) {
      return this.mapError(result.error);
    }

    // For auto-confirm, user and session will be available
    if (result.user && result.session) {
      const authUser = await this.fetchUserData(result.user.id, result.user.email || '');
      if (authUser) {
        return {
          success: true,
          user: authUser,
          session: this.mapSession(result.session),
        };
      }
    }

    // If email confirmation is required, return success without user data
    return { success: true };
  }

  async signOut(): Promise<AuthResult> {
    const { error } = await this.authDataSource.signOut();
    if (error) {
      return this.mapError(error);
    }
    return { success: true };
  }

  async resetPassword(credentials: ResetPasswordCredentials): Promise<AuthResult> {
    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await this.authDataSource.resetPassword({
      email: credentials.email,
      redirectUrl,
    });

    if (error) {
      return this.mapError(error);
    }
    return { success: true };
  }

  async updatePassword(credentials: UpdatePasswordCredentials): Promise<AuthResult> {
    const { error } = await this.authDataSource.updatePassword({
      newPassword: credentials.newPassword,
    });

    if (error) {
      return this.mapError(error);
    }
    return { success: true };
  }

  async getSession(): Promise<{ user: AuthenticatedUser | null; session: AuthSession | null }> {
    const { user, session } = await this.authDataSource.getSession();

    if (!user || !session) {
      return { user: null, session: null };
    }

    const authUser = await this.fetchUserData(user.id, user.email || '');
    return {
      user: authUser,
      session: this.mapSession(session),
    };
  }

  onAuthStateChange(
    callback: (user: AuthenticatedUser | null, session: AuthSession | null) => void
  ): () => void {
    return this.authDataSource.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        callback(null, null);
        return;
      }

      // Defer to avoid deadlock
      setTimeout(async () => {
        const authUser = await this.fetchUserData(session.user.id, session.user.email || '');
        callback(authUser, this.mapSession(session));
      }, 0);
    });
  }

  private async fetchUserData(userId: string, email: string): Promise<AuthenticatedUser | null> {
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

  private mapSession(session: import('@supabase/supabase-js').Session): AuthSession {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at || 0,
    };
  }

  private mapError(error: Error): AuthResult {
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials')) {
      return { success: false, error: createAuthError('INVALID_CREDENTIALS') };
    }
    if (message.includes('email not confirmed')) {
      return { success: false, error: createAuthError('EMAIL_NOT_CONFIRMED') };
    }
    if (message.includes('already registered')) {
      return { success: false, error: createAuthError('USER_ALREADY_EXISTS') };
    }
    if (message.includes('password')) {
      return { success: false, error: createAuthError('WEAK_PASSWORD') };
    }

    return { success: false, error: createAuthError('UNKNOWN_ERROR', error.message) };
  }
}
