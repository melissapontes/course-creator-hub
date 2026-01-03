// Dependency Injection Container for Student Feature
// Re-exports from courses feature

export { 
  createGetUserEnrollmentsUseCase,
  createToggleLessonCompletionUseCase,
  getEnrollmentRepository,
} from '@/features/courses/di';
