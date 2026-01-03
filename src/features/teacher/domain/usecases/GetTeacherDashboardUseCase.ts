// Use Case: Get Teacher Dashboard
// Fetches courses and sales data for teacher

import { ITeacherRepository } from '../repositories/ITeacherRepository';
import { TeacherCourse, TeacherSalesData, TeacherCourseStats } from '../entities';

export class GetTeacherDashboardUseCase {
  constructor(private readonly teacherRepository: ITeacherRepository) {}

  async execute(instructorId: string): Promise<{
    courses: TeacherCourse[];
    sales: TeacherSalesData;
    stats: TeacherCourseStats;
  }> {
    const [courses, sales] = await Promise.all([
      this.teacherRepository.getTeacherCourses(instructorId),
      this.teacherRepository.getTeacherSales(instructorId),
    ]);

    const stats: TeacherCourseStats = {
      totalCourses: courses.length,
      publishedCount: courses.filter((c) => c.status === 'PUBLICADO').length,
      draftCount: courses.filter((c) => c.status === 'RASCUNHO').length,
    };

    return { courses, sales, stats };
  }
}
