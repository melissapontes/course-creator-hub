// Auth Feature - barrel export
// Clean Architecture structure

// Domain layer exports
export * from './domain';

// Data layer (internal - not typically exported directly)
export { AuthRepositoryImpl, UserRepositoryImpl } from './data/repositories';

// DI container
export * from './di';

// Presentation layer - context and views
export { AuthProvider, useAuth } from './presentation/context/AuthContext';
export type { AuthUser, UserProfile } from './presentation/context/AuthContext';

// Views for routing
export {
  LoginPageView,
  RegisterPageView,
  ForgotPasswordPageView,
  ResetPasswordPageView,
  ProfilePageView,
} from './presentation/views';
