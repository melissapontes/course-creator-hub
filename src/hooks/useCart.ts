import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  course_id: string;
  created_at: string;
  course: {
    id: string;
    title: string;
    subtitle: string | null;
    thumbnail_url: string | null;
    price: number;
    instructor_id: string;
  };
}

export function useCart() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user enrollments to check if already purchased
  const { data: enrolledCourseIds = [] } = useQuery({
    queryKey: ['user-enrollments', authUser?.id],
    queryFn: async () => {
      if (!authUser) return [];
      
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', authUser.id);

      if (error) throw error;
      return data.map(e => e.course_id);
    },
    enabled: !!authUser,
  });

  // Fetch cart items with course details
  const { data: cartItems = [], isLoading, refetch } = useQuery({
    queryKey: ['cart', authUser?.id],
    queryFn: async () => {
      if (!authUser) return [];
      
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
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        course: Array.isArray(item.course) ? item.course[0] : item.course
      })) as CartItem[];
    },
    enabled: !!authUser,
  });

  // Check if course is already enrolled
  const isEnrolled = useCallback((courseId: string) => {
    return enrolledCourseIds.includes(courseId);
  }, [enrolledCourseIds]);

  // Add to cart mutation
  const addToCart = useMutation({
    mutationFn: async (courseId: string) => {
      if (!authUser) throw new Error('Usuário não autenticado');

      // Check if already enrolled
      if (enrolledCourseIds.includes(courseId)) {
        throw new Error('Você já possui este curso');
      }

      const { error } = await supabase
        .from('cart_items')
        .insert({ user_id: authUser.id, course_id: courseId });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Curso já está no carrinho');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Curso adicionado ao carrinho!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao adicionar ao carrinho');
    },
  });

  // Remove from cart mutation
  const removeFromCart = useMutation({
    mutationFn: async (courseId: string) => {
      if (!authUser) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', authUser.id)
        .eq('course_id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Curso removido do carrinho');
    },
    onError: () => {
      toast.error('Erro ao remover do carrinho');
    },
  });

  // Clear cart mutation
  const clearCart = useMutation({
    mutationFn: async () => {
      if (!authUser) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', authUser.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Check if course is in cart
  const isInCart = useCallback((courseId: string) => {
    return cartItems.some(item => item.course_id === courseId);
  }, [cartItems]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.course?.price) || 0), 0);
  const itemCount = cartItems.length;

  return {
    cartItems,
    isLoading,
    itemCount,
    subtotal,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    isEnrolled,
    refetch,
  };
}
