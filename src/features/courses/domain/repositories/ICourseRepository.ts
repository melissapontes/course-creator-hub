// Domain Repository Interface: ICourseRepository
// Defines the contract for course data operations

import { Course, CourseWithRating, Section, Lesson, CourseRating } from '../entities';

export interface ICourseRepository {
  // Public queries
  getPublishedCourses(): Promise<CourseWithRating[]>;
  getCourseById(id: string): Promise<Course | null>;
  getCourseWithDetails(id: string): Promise<{
    course: Course;
    sections: Section[];
    lessons: Lesson[];
    instructorName: string;
    rating: { average: number; count: number };
  } | null>;
  
  // Course management
  createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course>;
  updateCourse(id: string, data: Partial<Course>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  toggleCourseStatus(id: string, currentStatus: string): Promise<string>;
  
  // Sections
  getSections(courseId: string): Promise<Section[]>;
  createSection(data: Omit<Section, 'id' | 'createdAt'>): Promise<Section>;
  updateSection(id: string, data: Partial<Section>): Promise<Section>;
  deleteSection(id: string): Promise<void>;
  
  // Lessons
  getLessons(sectionIds: string[]): Promise<Lesson[]>;
  createLesson(data: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson>;
  updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(id: string): Promise<void>;
  
  // Ratings
  getCourseRatings(courseId: string): Promise<CourseRating[]>;
  createRating(data: Omit<CourseRating, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseRating>;
  updateRating(id: string, data: Partial<CourseRating>): Promise<CourseRating>;
  deleteRating(id: string): Promise<void>;
}
