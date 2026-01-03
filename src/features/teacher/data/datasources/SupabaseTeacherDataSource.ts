// Supabase Teacher Data Source Implementation

import { supabase } from '@/integrations/supabase/client';
import { TeacherCourse, TeacherSalesData, CourseComment } from '../../domain/entities';

export class SupabaseTeacherDataSource {
  async getTeacherCourses(instructorId: string): Promise<TeacherCourse[]> {
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

    if (coursesError) throw coursesError;

    // Fetch enrollments count
    const { data: enrollments } = await supabase.from('enrollments').select('course_id');

    const enrollmentCounts = (enrollments || []).reduce((acc, e) => {
      acc[e.course_id] = (acc[e.course_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (coursesData || []).map((course) => ({
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      thumbnailUrl: course.thumbnail_url,
      category: course.category,
      level: course.level,
      status: course.status,
      price: Number(course.price) || 0,
      salesCount: enrollmentCounts[course.id] || 0,
      createdAt: course.created_at,
    }));
  }

  async getTeacherSales(instructorId: string): Promise<TeacherSalesData> {
    const { data: instructorCourses } = await supabase
      .from('courses')
      .select('id, price')
      .eq('instructor_id', instructorId);

    if (!instructorCourses || instructorCourses.length === 0) {
      return { totalSales: 0, netRevenue: 0, enrollmentsCount: 0 };
    }

    const courseIds = instructorCourses.map((c) => c.id);
    const courseMap = new Map(instructorCourses.map((c) => [c.id, Number(c.price) || 0]));

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .in('course_id', courseIds);

    const totalSales = (enrollments || []).reduce((sum, enrollment) => {
      return sum + (courseMap.get(enrollment.course_id) || 0);
    }, 0);

    return {
      totalSales,
      netRevenue: totalSales * 0.85,
      enrollmentsCount: enrollments?.length || 0,
    };
  }

  async toggleCourseStatus(courseId: string, currentStatus: string): Promise<string> {
    const newStatus = currentStatus === 'PUBLICADO' ? 'RASCUNHO' : 'PUBLICADO';
    const { error } = await supabase.from('courses').update({ status: newStatus }).eq('id', courseId);
    if (error) throw error;
    return newStatus;
  }

  async deleteCourse(courseId: string): Promise<void> {
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) throw error;
  }

  async getCourseComments(courseId: string): Promise<CourseComment[]> {
    // Get all sections for this course
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, title')
      .eq('course_id', courseId);

    if (sectionsError) throw sectionsError;
    if (!sections?.length) return [];

    const sectionIds = sections.map((s) => s.id);
    const sectionMap = new Map(sections.map((s) => [s.id, s.title]));

    // Get all lessons for these sections
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, section_id')
      .in('section_id', sectionIds);

    if (lessonsError) throw lessonsError;
    if (!lessons?.length) return [];

    const lessonIds = lessons.map((l) => l.id);
    const lessonMap = new Map(lessons.map((l) => [l.id, { title: l.title, sectionId: l.section_id }]));

    // Get all comments for these lessons
    const { data: comments, error: commentsError } = await supabase
      .from('lesson_comments')
      .select('*')
      .in('lesson_id', lessonIds)
      .order('created_at', { ascending: false });

    if (commentsError) throw commentsError;
    if (!comments?.length) return [];

    // Get user profiles
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Map comments to CourseComment entities
    const allComments = comments.map((c) => {
      const lessonInfo = lessonMap.get(c.lesson_id);
      const profile = profileMap.get(c.user_id);
      return {
        id: c.id,
        content: c.content,
        userId: c.user_id,
        userName: profile?.full_name || 'Usuário',
        userAvatar: profile?.avatar_url || null,
        lessonId: c.lesson_id,
        lessonTitle: lessonInfo?.title || 'Aula',
        sectionTitle: lessonInfo?.sectionId ? (sectionMap.get(lessonInfo.sectionId) || 'Seção') : 'Seção',
        parentId: c.parent_id,
        createdAt: c.created_at,
      };
    });

    // Organize into threads
    const rootComments = allComments.filter((c) => !c.parentId);
    const replies = allComments.filter((c) => c.parentId);

    return rootComments.map((comment) => ({
      ...comment,
      replies: replies.filter((r) => r.parentId === comment.id),
    }));
  }

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('lesson_comments').delete().eq('id', commentId);
    if (error) throw error;
  }
}
