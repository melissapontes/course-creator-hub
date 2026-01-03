// Dependency Injection Container for Courses Feature
// Provides singleton instances of repositories and use cases

import { ICourseRepository, IEnrollmentRepository } from '../domain/repositories';
import {
  GetPublishedCoursesUseCase,
  GetCourseDetailsUseCase,
  GetUserEnrollmentsUseCase,
  ToggleLessonCompletionUseCase,
  CreateCourseUseCase,
} from '../domain/usecases';
import {
  SupabaseCourseDataSource,
  SupabaseEnrollmentDataSource,
} from '../data/datasources';
import { CourseRepositoryImpl, EnrollmentRepositoryImpl } from '../data/repositories';

// Singleton instances
let courseDataSource: SupabaseCourseDataSource | null = null;
let enrollmentDataSource: SupabaseEnrollmentDataSource | null = null;
let courseRepository: ICourseRepository | null = null;
let enrollmentRepository: IEnrollmentRepository | null = null;

// Data Sources
function getCourseDataSource(): SupabaseCourseDataSource {
  if (!courseDataSource) {
    courseDataSource = new SupabaseCourseDataSource();
  }
  return courseDataSource;
}

function getEnrollmentDataSource(): SupabaseEnrollmentDataSource {
  if (!enrollmentDataSource) {
    enrollmentDataSource = new SupabaseEnrollmentDataSource();
  }
  return enrollmentDataSource;
}

// Repositories
export function getCourseRepository(): ICourseRepository {
  if (!courseRepository) {
    courseRepository = new CourseRepositoryImpl(getCourseDataSource());
  }
  return courseRepository;
}

export function getEnrollmentRepository(): IEnrollmentRepository {
  if (!enrollmentRepository) {
    enrollmentRepository = new EnrollmentRepositoryImpl(getEnrollmentDataSource());
  }
  return enrollmentRepository;
}

// Use Cases Factory
export function createGetPublishedCoursesUseCase(): GetPublishedCoursesUseCase {
  return new GetPublishedCoursesUseCase(getCourseRepository());
}

export function createGetCourseDetailsUseCase(): GetCourseDetailsUseCase {
  return new GetCourseDetailsUseCase(getCourseRepository());
}

export function createGetUserEnrollmentsUseCase(): GetUserEnrollmentsUseCase {
  return new GetUserEnrollmentsUseCase(getEnrollmentRepository());
}

export function createToggleLessonCompletionUseCase(): ToggleLessonCompletionUseCase {
  return new ToggleLessonCompletionUseCase(getEnrollmentRepository());
}

export function createCreateCourseUseCase(): CreateCourseUseCase {
  return new CreateCourseUseCase(getCourseRepository());
}

// Reset function for testing
export function resetCoursesContainer(): void {
  courseDataSource = null;
  enrollmentDataSource = null;
  courseRepository = null;
  enrollmentRepository = null;
}
