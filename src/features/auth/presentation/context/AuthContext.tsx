/* eslint-disable @typescript-eslint/no-explicit-any */
// Auth Context - Provides authentication state to the app
// Uses the AuthViewModel for state management

import React, { createContext, useContext, useMemo } from 'react';
import { AuthViewModel, useAuthViewModel } from '../viewmodels/useAuthViewModel';
import { AppRole, AuthenticatedUser, AuthSession } from '../../domain/entities';

// Legacy types for backward compatibility
export type { AppRole };

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: 'ATIVO' | 'BLOQUEADO';
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  [x: string]: any;
  id: string;
  email: string;
  role: AppRole;
  profile: UserProfile;
}

interface AuthContextType {
  user: { id: string; email?: string } | null;
  session: { access_token: string } | null;
  authUser: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map AuthenticatedUser to legacy AuthUser format
function mapToLegacyAuthUser(user: AuthenticatedUser | null): AuthUser | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: {
      id: user.profile.id,
      full_name: user.profile.fullName,
      email: user.profile.email,
      avatar_url: user.profile.avatarUrl,
      status: user.profile.status,
      role: user.profile.role,
      created_at: user.profile.createdAt,
      updated_at: user.profile.updatedAt,
    },
  };
}

// Map AuthSession to legacy session format
function mapToLegacySession(session: AuthSession | null): { access_token: string } | null {
  if (!session) return null;
  return { access_token: session.accessToken };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const viewModel = useAuthViewModel();

  // Create legacy-compatible context value
  const contextValue = useMemo<AuthContextType>(() => ({
    user: viewModel.user ? { id: viewModel.user.id, email: viewModel.user.email } : null,
    session: mapToLegacySession(viewModel.session),
    authUser: mapToLegacyAuthUser(viewModel.user),
    loading: viewModel.isLoading,
    signUp: async (email, password, fullName, role) => {
      const result = await viewModel.signUp(email, password, fullName, role === 'ADMIN' ? 'ESTUDANTE' : role);
      return { error: result.success ? null : new Error(result.error?.message || 'Unknown error') };
    },
    signIn: async (email, password) => {
      const result = await viewModel.signIn(email, password);
      return { error: result.success ? null : new Error(result.error?.message || 'Unknown error') };
    },
    signOut: viewModel.signOut,
    resetPassword: async (email) => {
      const result = await viewModel.resetPassword(email);
      return { error: result.success ? null : new Error(result.error?.message || 'Unknown error') };
    },
    updatePassword: async (newPassword) => {
      const result = await viewModel.updatePassword(newPassword);
      return { error: result.success ? null : new Error(result.error?.message || 'Unknown error') };
    },
    refreshUser: viewModel.refreshUser,
  }), [viewModel]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
