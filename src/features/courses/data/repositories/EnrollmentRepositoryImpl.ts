// Enrollment Repository Implementation
// Implements IEnrollmentRepository using SupabaseEnrollmentDataSource

import { IEnrollmentRepository } from '../../domain/repositories/IEnrollmentRepository';
import { SupabaseEnrollmentDataSource } from '../datasources/SupabaseEnrollmentDataSource';
import { Enrollment, LessonProgress, EnrollmentWithProgress } from '../../domain/entities';

export class EnrollmentRepositoryImpl implements IEnrollmentRepository {
  constructor(private readonly dataSource: SupabaseEnrollmentDataSource) {}

  async getUserEnrollments(userId: string): Promise<EnrollmentWithProgress[]> {
    return this.dataSource.getUserEnrollments(userId);
  }

  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    return this.dataSource.isUserEnrolled(userId, courseId);
  }

  async getCourseAccess(
    userId: string,
    courseId: string
  ): Promise<{ hasAccess: boolean; isOwner: boolean }> {
    return this.dataSource.getCourseAccess(userId, courseId);
  }

  async createEnrollment(userId: string, courseId: string): Promise<Enrollment> {
    return this.dataSource.createEnrollment(userId, courseId);
  }

  async createEnrollments(enrollments: { userId: string; courseId: string }[]): Promise<void> {
    return this.dataSource.createEnrollments(enrollments);
  }

  async getLessonProgress(userId: string, lessonIds: string[]): Promise<LessonProgress[]> {
    return this.dataSource.getLessonProgress(userId, lessonIds);
  }

  async toggleLessonCompletion(
    userId: string,
    lessonId: string,
    currentProgress: LessonProgress | null
  ): Promise<void> {
    return this.dataSource.toggleLessonCompletion(userId, lessonId, currentProgress);
  }
}
