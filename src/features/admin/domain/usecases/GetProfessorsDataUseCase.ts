// Use Case: Get Professors Data
// Fetches professor statistics for admin

import { IAdminRepository } from '../repositories/IAdminRepository';
import { ProfessorData } from '../entities';

export class GetProfessorsDataUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(): Promise<{
    professors: ProfessorData[];
    totalProfessors: number;
    totalCourses: number;
    totalPaidToProfessors: number;
  }> {
    return this.adminRepository.getProfessorsData();
  }
}
