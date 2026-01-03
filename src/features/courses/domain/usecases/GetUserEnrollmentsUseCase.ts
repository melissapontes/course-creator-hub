// Use Case: Get User Enrollments
// Fetches enrolled courses with progress for a student

import { IEnrollmentRepository } from '../repositories/IEnrollmentRepository';
import { EnrollmentWithProgress } from '../entities';

export interface EnrollmentStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  averageProgress: number;
}

export class GetUserEnrollmentsUseCase {
  constructor(private readonly enrollmentRepository: IEnrollmentRepository) {}

  async execute(userId: string): Promise<{
    enrollments: EnrollmentWithProgress[];
    stats: EnrollmentStats;
  }> {
    const enrollments = await this.enrollmentRepository.getUserEnrollments(userId);

    const stats: EnrollmentStats = {
      totalCourses: enrollments.length,
      completedCourses: enrollments.filter(
        (e) => e.totalLessons > 0 && e.completedLessons === e.totalLessons
      ).length,
      inProgressCourses: enrollments.filter(
        (e) => e.completedLessons > 0 && e.completedLessons < e.totalLessons
      ).length,
      averageProgress: this.calculateAverageProgress(enrollments),
    };

    return { enrollments, stats };
  }

  private calculateAverageProgress(enrollments: EnrollmentWithProgress[]): number {
    const coursesWithLessons = enrollments.filter((e) => e.totalLessons > 0);
    if (coursesWithLessons.length === 0) return 0;

    const totalProgress = coursesWithLessons.reduce((acc, e) => {
      return acc + (e.completedLessons / e.totalLessons) * 100;
    }, 0);

    return Math.round(totalProgress / coursesWithLessons.length);
  }
}
