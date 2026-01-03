// Domain Entity: Authentication Credentials
// Value objects for authentication operations

import { AppRole } from './User';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
  role: Exclude<AppRole, 'ADMIN'>; // ADMIN cannot be self-registered
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface UpdatePasswordCredentials {
  newPassword: string;
}

export interface UpdateProfileData {
  fullName: string;
  avatarUrl?: string;
}
