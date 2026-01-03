// Test Factories - Generate mock data for tests
// Following factory pattern for consistent test data

import { AuthenticatedUser, AuthSession } from '@/features/auth/domain/entities/User';
import { Course, CourseWithRating, Section, Lesson, CourseFilters } from '@/features/courses/domain/entities/Course';
import { CartItem, CartSummary } from '@/features/cart/domain/entities/Cart';

// ============ Auth Factories ============

export const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'ESTUDANTE',
  avatarUrl: null,
  status: 'ATIVO',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Date.now() + 3600000, // 1 hour from now
  ...overrides,
});

// ============ Course Factories ============

export const createMockCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-123',
  title: 'Test Course',
  subtitle: 'A test course subtitle',
  description: 'A detailed test course description',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  category: 'Tecnologia',
  level: 'INICIANTE',
  language: 'pt-BR',
  status: 'PUBLICADO',
  price: 99.90,
  instructorId: 'instructor-123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCourseWithRating = (overrides: Partial<CourseWithRating> = {}): CourseWithRating => ({
  ...createMockCourse(),
  instructorName: 'Test Instructor',
  averageRating: 4.5,
  ratingCount: 10,
  ...overrides,
});

export const createMockSection = (overrides: Partial<Section> = {}): Section => ({
  id: 'section-123',
  courseId: 'course-123',
  title: 'Test Section',
  order: 1,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 'lesson-123',
  sectionId: 'section-123',
  title: 'Test Lesson',
  order: 1,
  contentType: 'VIDEO_UPLOAD',
  videoFileUrl: 'https://example.com/video.mp4',
  youtubeUrl: null,
  textContent: null,
  durationSeconds: 600,
  isPreviewFree: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCourseFilters = (overrides: Partial<CourseFilters> = {}): CourseFilters => ({
  search: '',
  category: 'all',
  level: 'all',
  dateFilter: 'all',
  sortBy: 'recent',
  ...overrides,
});

// ============ Cart Factories ============

export const createMockCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'cart-item-123',
  courseId: 'course-123',
  userId: 'user-123',
  createdAt: '2024-01-01T00:00:00Z',
  course: {
    id: 'course-123',
    title: 'Test Course',
    subtitle: 'A test course',
    thumbnailUrl: null,
    price: 99.90,
    instructorId: 'instructor-123',
  },
  ...overrides,
});

export const createMockCartSummary = (items: CartItem[] = []): CartSummary => ({
  items,
  itemCount: items.length,
  subtotal: items.reduce((sum, item) => sum + (item.course.price || 0), 0),
});

// ============ List Generators ============

export const createMockCourseList = (count: number, overrides: Partial<CourseWithRating> = {}): CourseWithRating[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockCourseWithRating({
      id: `course-${index + 1}`,
      title: `Test Course ${index + 1}`,
      createdAt: new Date(Date.now() - index * 86400000).toISOString(), // Each course 1 day older
      ...overrides,
    })
  );
};

export const createMockCartItems = (count: number): CartItem[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockCartItem({
      id: `cart-item-${index + 1}`,
      courseId: `course-${index + 1}`,
      course: {
        id: `course-${index + 1}`,
        title: `Test Course ${index + 1}`,
        subtitle: null,
        thumbnailUrl: null,
        price: 50 + index * 10,
        instructorId: 'instructor-123',
      },
    })
  );
};
