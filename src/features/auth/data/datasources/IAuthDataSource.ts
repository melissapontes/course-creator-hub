// Data Source Interface: IAuthDataSource
// Defines the contract for auth data operations
// This abstracts the actual data provider (Supabase in this case)

import { User, Session } from '@supabase/supabase-js';

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: string;
  redirectUrl: string;
}

export interface ResetPasswordParams {
  email: string;
  redirectUrl: string;
}

export interface UpdatePasswordParams {
  newPassword: string;
}

export interface AuthDataSourceResult {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

export interface IAuthDataSource {
  signIn(params: SignInParams): Promise<AuthDataSourceResult>;
  signUp(params: SignUpParams): Promise<AuthDataSourceResult>;
  signOut(): Promise<{ error: Error | null }>;
  resetPassword(params: ResetPasswordParams): Promise<{ error: Error | null }>;
  updatePassword(params: UpdatePasswordParams): Promise<{ error: Error | null }>;
  getSession(): Promise<{ user: User | null; session: Session | null }>;
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): () => void;
}
