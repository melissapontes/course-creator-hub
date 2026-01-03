// Admin Repository Implementation

import { IAdminRepository } from '../../domain/repositories/IAdminRepository';
import { SupabaseAdminDataSource } from '../datasources/SupabaseAdminDataSource';
import { AdminDashboardData, ProfessorData, StudentData } from '../../domain/entities';

export class AdminRepositoryImpl implements IAdminRepository {
  constructor(private readonly dataSource: SupabaseAdminDataSource) {}

  async getDashboardData(): Promise<AdminDashboardData> {
    return this.dataSource.getDashboardData();
  }

  async getProfessorsData(): Promise<{
    professors: ProfessorData[];
    totalProfessors: number;
    totalCourses: number;
    totalPaidToProfessors: number;
  }> {
    return this.dataSource.getProfessorsData();
  }

  async getStudentsData(): Promise<{
    students: StudentData[];
    studentsWithPurchases: StudentData[];
    totalStudents: number;
    totalBuyers: number;
    totalSpent: number;
  }> {
    return this.dataSource.getStudentsData();
  }
}
