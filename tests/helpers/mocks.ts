// Test Mocks - Mock implementations for repositories and services
// These mocks are used to isolate units under test from external dependencies

import { vi } from 'vitest';
import { IAuthRepository } from '@/features/auth/domain/repositories/IAuthRepository';
import { ICourseRepository } from '@/features/courses/domain/repositories/ICourseRepository';
import { ICartRepository } from '@/features/cart/domain/repositories/ICartRepository';
import { AuthResult } from '@/features/auth/domain/entities/AuthResult';
import { CourseWithRating, Course, Section, Lesson, CourseRating } from '@/features/courses/domain/entities/Course';
import { CartItem } from '@/features/cart/domain/entities/Cart';

// ============ Auth Repository Mock ============

export const createMockAuthRepository = (): jest.Mocked<IAuthRepository> => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
});

// ============ Course Repository Mock ============

export const createMockCourseRepository = (): jest.Mocked<ICourseRepository> => ({
  getPublishedCourses: vi.fn(),
  getCourseById: vi.fn(),
  getCourseWithDetails: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  toggleCourseStatus: vi.fn(),
  getSections: vi.fn(),
  createSection: vi.fn(),
  updateSection: vi.fn(),
  deleteSection: vi.fn(),
  getLessons: vi.fn(),
  createLesson: vi.fn(),
  updateLesson: vi.fn(),
  deleteLesson: vi.fn(),
  getCourseRatings: vi.fn(),
  createRating: vi.fn(),
  updateRating: vi.fn(),
  deleteRating: vi.fn(),
});

// ============ Cart Repository Mock ============

export const createMockCartRepository = (): jest.Mocked<ICartRepository> => ({
  getCartItems: vi.fn(),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  isInCart: vi.fn(),
  getEnrolledCourseIds: vi.fn(),
});

// ============ Success/Failure Result Helpers ============

export const createSuccessResult = (data?: Partial<AuthResult>): AuthResult => ({
  success: true,
  ...data,
});

export const createFailureResult = (code: string, message: string): AuthResult => ({
  success: false,
  error: { code: code as any, message },
});
