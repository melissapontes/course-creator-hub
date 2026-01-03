// Use Case: Get Teacher Courses
// Fetches all courses for a specific teacher

import { ICourseRepository } from '../repositories/ICourseRepository';
import { Course } from '../entities';

export interface TeacherCourse extends Course {
  salesCount: number;
}

export class GetTeacherCoursesUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async execute(instructorId: string): Promise<TeacherCourse[]> {
    // This would ideally be a single repository method
    // For now, we'll fetch courses and the repository will add sales count
    const courses = await this.courseRepository.getPublishedCourses();
    
    // Filter by instructor
    return courses
      .filter(c => c.instructorId === instructorId)
      .map(c => ({
        ...c,
        salesCount: 0, // Would be calculated from enrollments
      }));
  }
}
