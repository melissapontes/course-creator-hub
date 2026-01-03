// Domain Entity: Student Stats
// Re-exports from courses feature for student-specific use

export { 
  type EnrollmentWithProgress,
  type LessonProgress,
} from '@/features/courses/domain/entities';

export interface StudentStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  averageProgress: number;
}
