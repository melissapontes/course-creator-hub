// Supabase Cart Data Source Implementation
// Handles all cart-related database operations

import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '../../domain/entities';

export class SupabaseCartDataSource {
  async getCartItems(userId: string): Promise<CartItem[]> {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        course_id,
        created_at,
        course:courses (
          id,
          title,
          subtitle,
          thumbnail_url,
          price,
          instructor_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      courseId: item.course_id,
      userId,
      createdAt: item.created_at,
      course: {
        id: (item.course as any)?.id || '',
        title: (item.course as any)?.title || '',
        subtitle: (item.course as any)?.subtitle || null,
        thumbnailUrl: (item.course as any)?.thumbnail_url || null,
        price: Number((item.course as any)?.price) || 0,
        instructorId: (item.course as any)?.instructor_id || '',
      },
    }));
  }

  async addToCart(userId: string, courseId: string): Promise<void> {
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, course_id: courseId });

    if (error) throw error;
  }

  async removeFromCart(userId: string, courseId: string): Promise<void> {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) throw error;
  }

  async clearCart(userId: string): Promise<void> {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }

  async isInCart(userId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  async getEnrolledCourseIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((e) => e.course_id);
  }
}
