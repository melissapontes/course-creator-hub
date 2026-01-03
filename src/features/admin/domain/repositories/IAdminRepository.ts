// Domain Repository Interface: IAdminRepository
// Defines the contract for admin data operations

import { AdminDashboardData, ProfessorData, StudentData } from '../entities';

export interface IAdminRepository {
  getDashboardData(): Promise<AdminDashboardData>;
  getProfessorsData(): Promise<{
    professors: ProfessorData[];
    totalProfessors: number;
    totalCourses: number;
    totalPaidToProfessors: number;
  }>;
  getStudentsData(): Promise<{
    students: StudentData[];
    studentsWithPurchases: StudentData[];
    totalStudents: number;
    totalBuyers: number;
    totalSpent: number;
  }>;
}
