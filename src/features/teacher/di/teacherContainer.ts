// Dependency Injection Container for Teacher Feature

import { ITeacherRepository } from '../domain/repositories';
import { 
  GetTeacherDashboardUseCase, 
  GetCourseCommentsUseCase,
  DeleteCommentUseCase,
} from '../domain/usecases';
import { SupabaseTeacherDataSource } from '../data/datasources';
import { TeacherRepositoryImpl } from '../data/repositories';

// Singleton instances
let teacherDataSource: SupabaseTeacherDataSource | null = null;
let teacherRepository: ITeacherRepository | null = null;

// Data Sources
function getTeacherDataSource(): SupabaseTeacherDataSource {
  if (!teacherDataSource) {
    teacherDataSource = new SupabaseTeacherDataSource();
  }
  return teacherDataSource;
}

// Repositories
export function getTeacherRepository(): ITeacherRepository {
  if (!teacherRepository) {
    teacherRepository = new TeacherRepositoryImpl(getTeacherDataSource());
  }
  return teacherRepository;
}

// Use Cases Factory
export function createGetTeacherDashboardUseCase(): GetTeacherDashboardUseCase {
  return new GetTeacherDashboardUseCase(getTeacherRepository());
}

export function createGetCourseCommentsUseCase(): GetCourseCommentsUseCase {
  return new GetCourseCommentsUseCase(getTeacherRepository());
}

export function createDeleteCommentUseCase(): DeleteCommentUseCase {
  return new DeleteCommentUseCase(getTeacherRepository());
}

// Reset function for testing
export function resetTeacherContainer(): void {
  teacherDataSource = null;
  teacherRepository = null;
}
