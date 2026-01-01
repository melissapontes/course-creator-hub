import type { AppRole } from '@/app/rbac';

export type UserStatus = 'ATIVO' | 'BLOQUEADO';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}
