export type AppRole = 'PROFESSOR' | 'ESTUDANTE' | 'ADMIN';
export type UserStatus = 'ATIVO' | 'BLOQUEADO';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface ProfessorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  profile: UserProfile;
  professorProfile?: ProfessorProfile;
  studentProfile?: StudentProfile;
}
