// Use Case: Get all comments for a course (professor view)
// Fetches all lesson comments across all sections/lessons

import { ITeacherRepository } from '../repositories/ITeacherRepository';
import { CourseComment } from '../entities';

export class GetCourseCommentsUseCase {
  constructor(private readonly teacherRepository: ITeacherRepository) {}

  async execute(courseId: string): Promise<CourseComment[]> {
    return this.teacherRepository.getCourseComments(courseId);
  }
}
