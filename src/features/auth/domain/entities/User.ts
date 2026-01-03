// Domain Entity: User
// Pure domain model without any framework dependencies

export type AppRole = 'PROFESSOR' | 'ESTUDANTE' | 'ADMIN';
export type UserStatus = 'ATIVO' | 'BLOQUEADO';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: UserStatus;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AppRole;
  profile: UserProfile;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: AuthenticatedUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
