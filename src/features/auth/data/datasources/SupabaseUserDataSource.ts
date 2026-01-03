// Supabase User Data Source Implementation
// Implements IUserDataSource using Supabase client

import { supabase } from '@/integrations/supabase/client';
import {
  IUserDataSource,
  UserProfileRow,
  UserRoleRow,
  UpdateProfileParams,
} from './IUserDataSource';

export class SupabaseUserDataSource implements IUserDataSource {
  async getProfileById(userId: string): Promise<{ data: UserProfileRow | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    return {
      data: data as UserProfileRow | null,
      error: error as Error | null,
    };
  }

  async getRoleByUserId(userId: string): Promise<{ data: UserRoleRow | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      data: data as UserRoleRow | null,
      error: error as Error | null,
    };
  }

  async updateProfile(
    userId: string,
    params: UpdateProfileParams
  ): Promise<{ error: Error | null }> {
    const updateData: Record<string, unknown> = {
      full_name: params.fullName,
    };

    if (params.avatarUrl !== undefined) {
      updateData.avatar_url = params.avatarUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    return { error: error as Error | null };
  }

  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{ url: string | null; error: Error | null }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      return { url: null, error: uploadError as Error };
    }

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    return { url: urlData.publicUrl, error: null };
  }
}
