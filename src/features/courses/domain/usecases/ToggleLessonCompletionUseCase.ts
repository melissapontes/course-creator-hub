// Use Case: Toggle Lesson Completion
// Marks a lesson as complete or incomplete

import { IEnrollmentRepository } from '../repositories/IEnrollmentRepository';
import { LessonProgress } from '../entities';

export class ToggleLessonCompletionUseCase {
  constructor(private readonly enrollmentRepository: IEnrollmentRepository) {}

  async execute(
    userId: string,
    lessonId: string,
    currentProgress: LessonProgress | null
  ): Promise<void> {
    return this.enrollmentRepository.toggleLessonCompletion(userId, lessonId, currentProgress);
  }
}
