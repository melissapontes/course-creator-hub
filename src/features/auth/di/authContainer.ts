// Dependency Injection Container for Auth Feature
// Provides singleton instances of repositories and use cases

import { IAuthRepository, IUserRepository } from '../domain/repositories';
import {
  SignInUseCase,
  SignUpUseCase,
  SignOutUseCase,
  ResetPasswordUseCase,
  UpdatePasswordUseCase,
  GetCurrentUserUseCase,
  UpdateProfileUseCase,
} from '../domain/usecases';
import {
  SupabaseAuthDataSource,
  SupabaseUserDataSource,
} from '../data/datasources';
import { AuthRepositoryImpl, UserRepositoryImpl } from '../data/repositories';

// Singleton instances
let authDataSource: SupabaseAuthDataSource | null = null;
let userDataSource: SupabaseUserDataSource | null = null;
let authRepository: IAuthRepository | null = null;
let userRepository: IUserRepository | null = null;

// Data Sources
function getAuthDataSource(): SupabaseAuthDataSource {
  if (!authDataSource) {
    authDataSource = new SupabaseAuthDataSource();
  }
  return authDataSource;
}

function getUserDataSource(): SupabaseUserDataSource {
  if (!userDataSource) {
    userDataSource = new SupabaseUserDataSource();
  }
  return userDataSource;
}

// Repositories
export function getAuthRepository(): IAuthRepository {
  if (!authRepository) {
    authRepository = new AuthRepositoryImpl(getAuthDataSource(), getUserDataSource());
  }
  return authRepository;
}

export function getUserRepository(): IUserRepository {
  if (!userRepository) {
    userRepository = new UserRepositoryImpl(getUserDataSource());
  }
  return userRepository;
}

// Use Cases Factory
export function createSignInUseCase(): SignInUseCase {
  return new SignInUseCase(getAuthRepository());
}

export function createSignUpUseCase(): SignUpUseCase {
  return new SignUpUseCase(getAuthRepository());
}

export function createSignOutUseCase(): SignOutUseCase {
  return new SignOutUseCase(getAuthRepository());
}

export function createResetPasswordUseCase(): ResetPasswordUseCase {
  return new ResetPasswordUseCase(getAuthRepository());
}

export function createUpdatePasswordUseCase(): UpdatePasswordUseCase {
  return new UpdatePasswordUseCase(getAuthRepository());
}

export function createGetCurrentUserUseCase(): GetCurrentUserUseCase {
  return new GetCurrentUserUseCase(getAuthRepository());
}

export function createUpdateProfileUseCase(): UpdateProfileUseCase {
  return new UpdateProfileUseCase(getUserRepository());
}

// Reset function for testing
export function resetAuthContainer(): void {
  authDataSource = null;
  userDataSource = null;
  authRepository = null;
  userRepository = null;
}
