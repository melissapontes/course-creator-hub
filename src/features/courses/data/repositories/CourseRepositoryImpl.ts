// Course Repository Implementation
// Implements ICourseRepository using SupabaseCourseDataSource

import { ICourseRepository } from '../../domain/repositories/ICourseRepository';
import { SupabaseCourseDataSource } from '../datasources/SupabaseCourseDataSource';
import { Course, CourseWithRating, Section, Lesson, CourseRating } from '../../domain/entities';

export class CourseRepositoryImpl implements ICourseRepository {
  constructor(private readonly dataSource: SupabaseCourseDataSource) {}

  async getPublishedCourses(): Promise<CourseWithRating[]> {
    return this.dataSource.getPublishedCourses();
  }

  async getCourseById(id: string): Promise<Course | null> {
    return this.dataSource.getCourseById(id);
  }

  async getCourseWithDetails(id: string): Promise<{
    course: Course;
    sections: Section[];
    lessons: Lesson[];
    instructorName: string;
    rating: { average: number; count: number };
  } | null> {
    return this.dataSource.getCourseWithDetails(id);
  }

  async createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    return this.dataSource.createCourse(data);
  }

  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    return this.dataSource.updateCourse(id, data);
  }

  async deleteCourse(id: string): Promise<void> {
    return this.dataSource.deleteCourse(id);
  }

  async toggleCourseStatus(id: string, currentStatus: string): Promise<string> {
    return this.dataSource.toggleCourseStatus(id, currentStatus);
  }

  // Sections - to be implemented
  async getSections(courseId: string): Promise<Section[]> {
    throw new Error('Not implemented');
  }

  async createSection(data: Omit<Section, 'id' | 'createdAt'>): Promise<Section> {
    throw new Error('Not implemented');
  }

  async updateSection(id: string, data: Partial<Section>): Promise<Section> {
    throw new Error('Not implemented');
  }

  async deleteSection(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  // Lessons - to be implemented
  async getLessons(sectionIds: string[]): Promise<Lesson[]> {
    throw new Error('Not implemented');
  }

  async createLesson(data: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson> {
    throw new Error('Not implemented');
  }

  async updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson> {
    throw new Error('Not implemented');
  }

  async deleteLesson(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  // Ratings - to be implemented
  async getCourseRatings(courseId: string): Promise<CourseRating[]> {
    throw new Error('Not implemented');
  }

  async createRating(data: Omit<CourseRating, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseRating> {
    throw new Error('Not implemented');
  }

  async updateRating(id: string, data: Partial<CourseRating>): Promise<CourseRating> {
    throw new Error('Not implemented');
  }

  async deleteRating(id: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
