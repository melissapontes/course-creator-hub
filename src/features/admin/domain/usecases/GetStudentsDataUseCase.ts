// Use Case: Get Students Data
// Fetches student statistics for admin

import { IAdminRepository } from '../repositories/IAdminRepository';
import { StudentData } from '../entities';

export class GetStudentsDataUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(): Promise<{
    students: StudentData[];
    studentsWithPurchases: StudentData[];
    totalStudents: number;
    totalBuyers: number;
    totalSpent: number;
  }> {
    return this.adminRepository.getStudentsData();
  }
}
