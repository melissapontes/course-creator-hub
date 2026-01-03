// Domain Repository Interface: IEnrollmentRepository
// Defines the contract for enrollment operations

import { Enrollment, LessonProgress, EnrollmentWithProgress } from '../entities';

export interface IEnrollmentRepository {
  // Queries
  getUserEnrollments(userId: string): Promise<EnrollmentWithProgress[]>;
  isUserEnrolled(userId: string, courseId: string): Promise<boolean>;
  getCourseAccess(userId: string, courseId: string): Promise<{ hasAccess: boolean; isOwner: boolean }>;
  
  // Enrollment management
  createEnrollment(userId: string, courseId: string): Promise<Enrollment>;
  createEnrollments(enrollments: { userId: string; courseId: string }[]): Promise<void>;
  
  // Progress
  getLessonProgress(userId: string, lessonIds: string[]): Promise<LessonProgress[]>;
  toggleLessonCompletion(userId: string, lessonId: string, currentProgress: LessonProgress | null): Promise<void>;
}
