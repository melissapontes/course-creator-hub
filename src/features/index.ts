// Features - barrel export
// All feature modules following Clean Architecture
// Note: Due to potential naming conflicts, import from specific features when needed

// Auth Feature - Authentication and User Management
export { AuthProvider, useAuth } from './auth';
export type { AuthUser, UserProfile, AppRole } from './auth';

// Re-export DI containers for use cases
export * from './auth/di';
export * from './courses/di';
export * from './cart/di';
export * from './teacher/di';
export * from './student/di';
export * from './admin/di';
