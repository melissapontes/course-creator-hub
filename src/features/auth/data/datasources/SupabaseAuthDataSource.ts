// Supabase Auth Data Source Implementation
// Implements IAuthDataSource using Supabase client

import { supabase } from '@/integrations/supabase/client';
import {
  IAuthDataSource,
  SignInParams,
  SignUpParams,
  ResetPasswordParams,
  UpdatePasswordParams,
  AuthDataSourceResult,
} from './IAuthDataSource';

export class SupabaseAuthDataSource implements IAuthDataSource {
  async signIn(params: SignInParams): Promise<AuthDataSourceResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    return {
      user: data.user,
      session: data.session,
      error: error as Error | null,
    };
  }

  async signUp(params: SignUpParams): Promise<AuthDataSourceResult> {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        emailRedirectTo: params.redirectUrl,
        data: {
          full_name: params.fullName,
          role: params.role,
        },
      },
    });

    return {
      user: data.user,
      session: data.session,
      error: error as Error | null,
    };
  }

  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error as Error | null };
  }

  async resetPassword(params: ResetPasswordParams): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(params.email, {
      redirectTo: params.redirectUrl,
    });
    return { error: error as Error | null };
  }

  async updatePassword(params: UpdatePasswordParams): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.updateUser({
      password: params.newPassword,
    });
    return { error: error as Error | null };
  }

  async getSession(): Promise<{ user: import('@supabase/supabase-js').User | null; session: import('@supabase/supabase-js').Session | null }> {
    const { data } = await supabase.auth.getSession();
    return {
      user: data.session?.user ?? null,
      session: data.session,
    };
  }

  onAuthStateChange(
    callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void
  ): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  }
}
