// Supabase Course Data Source Implementation
// Handles all course-related database operations

import { supabase } from '@/integrations/supabase/client';
import {
  Course,
  CourseWithRating,
  Section,
  Lesson,
  CourseRating,
} from '../../domain/entities';

export class SupabaseCourseDataSource {
  async getPublishedCourses(): Promise<CourseWithRating[]> {
    // Fetch courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'PUBLICADO')
      .order('created_at', { ascending: false });

    if (coursesError) throw coursesError;
    if (!courses || courses.length === 0) return [];

    // Fetch instructor names
    const instructorIds = [...new Set(courses.map((c) => c.instructor_id))];
    const { data: instructors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', instructorIds);

    const instructorMap: Record<string, string> = {};
    instructors?.forEach((p) => {
      instructorMap[p.id] = p.full_name;
    });

    // Fetch ratings
    const courseIds = courses.map((c) => c.id);
    const { data: ratings } = await supabase
      .from('course_ratings')
      .select('course_id, rating')
      .in('course_id', courseIds);

    const ratingMap: Record<string, { average: number; count: number }> = {};
    if (ratings) {
      const grouped: Record<string, number[]> = {};
      ratings.forEach((r) => {
        if (!grouped[r.course_id]) grouped[r.course_id] = [];
        grouped[r.course_id].push(r.rating);
      });

      Object.entries(grouped).forEach(([courseId, ratingsList]) => {
        const average = ratingsList.reduce((a, b) => a + b, 0) / ratingsList.length;
        ratingMap[courseId] = { average, count: ratingsList.length };
      });
    }

    return courses.map((course) => this.mapToCourseWithRating(course, instructorMap, ratingMap));
  }

  async getCourseById(id: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return this.mapToCourse(data);
  }

  async getCourseWithDetails(id: string): Promise<{
    course: Course;
    sections: Section[];
    lessons: Lesson[];
    instructorName: string;
    rating: { average: number; count: number };
  } | null> {
    // Fetch course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (courseError) throw courseError;
    if (!courseData) return null;

    // Fetch instructor name
    const { data: instructor } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', courseData.instructor_id)
      .maybeSingle();

    // Fetch sections
    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .eq('course_id', id)
      .order('order');

    // Fetch lessons
    let lessonsData: any[] = [];
    if (sectionsData && sectionsData.length > 0) {
      const sectionIds = sectionsData.map((s) => s.id);
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .in('section_id', sectionIds)
        .order('order');
      lessonsData = data || [];
    }

    // Fetch ratings
    const { data: ratingsData } = await supabase
      .from('course_ratings')
      .select('rating')
      .eq('course_id', id);

    const rating = ratingsData && ratingsData.length > 0
      ? {
          average: ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length,
          count: ratingsData.length,
        }
      : { average: 0, count: 0 };

    return {
      course: this.mapToCourse(courseData),
      sections: (sectionsData || []).map(this.mapToSection),
      lessons: lessonsData.map(this.mapToLesson),
      instructorName: instructor?.full_name || '',
      rating,
    };
  }

  async createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    const { data: result, error } = await supabase
      .from('courses')
      .insert({
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        thumbnail_url: data.thumbnailUrl,
        category: data.category,
        level: data.level,
        language: data.language,
        status: data.status,
        price: data.price,
        instructor_id: data.instructorId,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToCourse(result);
  }

  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.thumbnailUrl !== undefined) updateData.thumbnail_url = data.thumbnailUrl;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.price !== undefined) updateData.price = data.price;

    const { data: result, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCourse(result);
  }

  async deleteCourse(id: string): Promise<void> {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
  }

  async toggleCourseStatus(id: string, currentStatus: string): Promise<string> {
    const newStatus = currentStatus === 'PUBLICADO' ? 'RASCUNHO' : 'PUBLICADO';
    const { error } = await supabase.from('courses').update({ status: newStatus }).eq('id', id);
    if (error) throw error;
    return newStatus;
  }

  // Mapping functions
  private mapToCourse(data: any): Course {
    return {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      category: data.category,
      level: data.level,
      language: data.language,
      status: data.status,
      price: Number(data.price) || 0,
      instructorId: data.instructor_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToCourseWithRating(
    data: any,
    instructorMap: Record<string, string>,
    ratingMap: Record<string, { average: number; count: number }>
  ): CourseWithRating {
    const rating = ratingMap[data.id] || { average: 0, count: 0 };
    return {
      ...this.mapToCourse(data),
      instructorName: instructorMap[data.instructor_id] || '',
      averageRating: rating.average,
      ratingCount: rating.count,
    };
  }

  private mapToSection(data: any): Section {
    return {
      id: data.id,
      courseId: data.course_id,
      title: data.title,
      order: data.order,
      createdAt: data.created_at,
    };
  }

  private mapToLesson(data: any): Lesson {
    return {
      id: data.id,
      sectionId: data.section_id,
      title: data.title,
      order: data.order,
      contentType: data.content_type,
      videoFileUrl: data.video_file_url,
      youtubeUrl: data.youtube_url,
      textContent: data.text_content,
      durationSeconds: data.duration_seconds,
      isPreviewFree: data.is_preview_free,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
