// Supabase Teacher Data Source Implementation

import { supabase } from '@/integrations/supabase/client';
import { TeacherCourse, TeacherSalesData } from '../../domain/entities';

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
}
