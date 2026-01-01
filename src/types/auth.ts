export type AppRole = 'PROFESSOR' | 'ESTUDANTE' | 'ADMIN';
export type UserStatus = 'ATIVO' | 'BLOQUEADO';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: UserStatus;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  profile: UserProfile;
}
