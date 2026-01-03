// Supabase Enrollment Data Source Implementation
// Handles all enrollment-related database operations

import { supabase } from '@/integrations/supabase/client';
import { Enrollment, LessonProgress, EnrollmentWithProgress } from '../../domain/entities';

export class SupabaseEnrollmentDataSource {
  async getUserEnrollments(userId: string): Promise<EnrollmentWithProgress[]> {
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        enrolled_at,
        status,
        courses:course_id (
          id,
          title,
          subtitle,
          thumbnail_url,
          level,
          category
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'ATIVO');

    if (enrollmentError) throw enrollmentError;
    if (!enrollmentData) return [];

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollmentData.map(async (enrollment) => {
        const { data: sections } = await supabase
          .from('sections')
          .select('id')
          .eq('course_id', enrollment.course_id);

        if (!sections || sections.length === 0) {
          return this.mapToEnrollmentWithProgress(enrollment, 0, 0);
        }

        const sectionIds = sections.map((s) => s.id);

        const { count: totalLessons } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .in('section_id', sectionIds);

        const { data: lessonIds } = await supabase
          .from('lessons')
          .select('id')
          .in('section_id', sectionIds);

        let completedLessons = 0;
        if (lessonIds && lessonIds.length > 0) {
          const { count } = await supabase
            .from('lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)
            .in('lesson_id', lessonIds.map((l) => l.id));

          completedLessons = count || 0;
        }

        return this.mapToEnrollmentWithProgress(enrollment, totalLessons || 0, completedLessons);
      })
    );

    return enrollmentsWithProgress;
  }

  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  async getCourseAccess(
    userId: string,
    courseId: string
  ): Promise<{ hasAccess: boolean; isOwner: boolean }> {
    // Check enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (enrollment) return { hasAccess: true, isOwner: false };

    // Check ownership
    const { data: course } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .maybeSingle();

    if (course?.instructor_id === userId) return { hasAccess: true, isOwner: true };

    return { hasAccess: false, isOwner: false };
  }

  async createEnrollment(userId: string, courseId: string): Promise<Enrollment> {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId, status: 'ATIVO' })
      .select()
      .single();

    if (error) throw error;
    return this.mapToEnrollment(data);
  }

  async createEnrollments(enrollments: { userId: string; courseId: string }[]): Promise<void> {
    const insertData = enrollments.map((e) => ({
      user_id: e.userId,
      course_id: e.courseId,
      status: 'ATIVO',
    }));

    const { error } = await supabase.from('enrollments').insert(insertData);
    if (error) throw error;
  }

  async getLessonProgress(userId: string, lessonIds: string[]): Promise<LessonProgress[]> {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);

    if (error) throw error;
    return (data || []).map(this.mapToLessonProgress);
  }

  async toggleLessonCompletion(
    userId: string,
    lessonId: string,
    currentProgress: LessonProgress | null
  ): Promise<void> {
    if (currentProgress) {
      const { error } = await supabase
        .from('lesson_progress')
        .update({
          completed: !currentProgress.completed,
          completed_at: !currentProgress.completed ? new Date().toISOString() : null,
        })
        .eq('id', currentProgress.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('lesson_progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
  }

  // Mapping functions
  private mapToEnrollment(data: any): Enrollment {
    return {
      id: data.id,
      userId: data.user_id,
      courseId: data.course_id,
      status: data.status,
      enrolledAt: data.enrolled_at,
    };
  }

  private mapToEnrollmentWithProgress(
    data: any,
    totalLessons: number,
    completedLessons: number
  ): EnrollmentWithProgress {
    const course = data.courses;
    return {
      id: data.id,
      userId: data.user_id || '',
      courseId: data.course_id,
      status: data.status,
      enrolledAt: data.enrolled_at,
      course: {
        id: course?.id || '',
        title: course?.title || '',
        subtitle: course?.subtitle || null,
        thumbnailUrl: course?.thumbnail_url || null,
        level: course?.level || '',
        category: course?.category || '',
      },
      totalLessons,
      completedLessons,
    };
  }

  private mapToLessonProgress(data: any): LessonProgress {
    return {
      id: data.id,
      userId: data.user_id,
      lessonId: data.lesson_id,
      completed: data.completed,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
