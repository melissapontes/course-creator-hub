// Use Case: Get Course Details
// Fetches complete course information for the detail page

import { ICourseRepository } from '../repositories/ICourseRepository';
import { Course, Section, Lesson } from '../entities';

export interface CourseDetails {
  course: Course;
  sections: Section[];
  lessons: Lesson[];
  instructorName: string;
  rating: { average: number; count: number };
}

export class GetCourseDetailsUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async execute(courseId: string): Promise<CourseDetails | null> {
    return this.courseRepository.getCourseWithDetails(courseId);
  }
}
