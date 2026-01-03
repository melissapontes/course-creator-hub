// Dependency Injection Container for Admin Feature

import { IAdminRepository } from '../domain/repositories';
import {
  GetAdminDashboardUseCase,
  GetProfessorsDataUseCase,
  GetStudentsDataUseCase,
} from '../domain/usecases';
import { SupabaseAdminDataSource } from '../data/datasources';
import { AdminRepositoryImpl } from '../data/repositories';

// Singleton instances
let adminDataSource: SupabaseAdminDataSource | null = null;
let adminRepository: IAdminRepository | null = null;

// Data Sources
function getAdminDataSource(): SupabaseAdminDataSource {
  if (!adminDataSource) {
    adminDataSource = new SupabaseAdminDataSource();
  }
  return adminDataSource;
}

// Repositories
export function getAdminRepository(): IAdminRepository {
  if (!adminRepository) {
    adminRepository = new AdminRepositoryImpl(getAdminDataSource());
  }
  return adminRepository;
}

// Use Cases Factory
export function createGetAdminDashboardUseCase(): GetAdminDashboardUseCase {
  return new GetAdminDashboardUseCase(getAdminRepository());
}

export function createGetProfessorsDataUseCase(): GetProfessorsDataUseCase {
  return new GetProfessorsDataUseCase(getAdminRepository());
}

export function createGetStudentsDataUseCase(): GetStudentsDataUseCase {
  return new GetStudentsDataUseCase(getAdminRepository());
}

// Reset function for testing
export function resetAdminContainer(): void {
  adminDataSource = null;
  adminRepository = null;
}
