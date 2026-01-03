// Teacher Repository Implementation

import { ITeacherRepository } from '../../domain/repositories/ITeacherRepository';
import { SupabaseTeacherDataSource } from '../datasources/SupabaseTeacherDataSource';
import { TeacherCourse, TeacherSalesData } from '../../domain/entities';

export class TeacherRepositoryImpl implements ITeacherRepository {
  constructor(private readonly dataSource: SupabaseTeacherDataSource) {}

  async getTeacherCourses(instructorId: string): Promise<TeacherCourse[]> {
    return this.dataSource.getTeacherCourses(instructorId);
  }

  async getTeacherSales(instructorId: string): Promise<TeacherSalesData> {
    return this.dataSource.getTeacherSales(instructorId);
  }

  async toggleCourseStatus(courseId: string, currentStatus: string): Promise<string> {
    return this.dataSource.toggleCourseStatus(courseId, currentStatus);
  }

  async deleteCourse(courseId: string): Promise<void> {
    return this.dataSource.deleteCourse(courseId);
  }
}
