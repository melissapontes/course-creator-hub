// Use Case: Get Admin Dashboard
// Fetches financial and stats data for admin dashboard

import { IAdminRepository } from '../repositories/IAdminRepository';
import { AdminDashboardData } from '../entities';

export class GetAdminDashboardUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(): Promise<AdminDashboardData> {
    return this.adminRepository.getDashboardData();
  }
}
