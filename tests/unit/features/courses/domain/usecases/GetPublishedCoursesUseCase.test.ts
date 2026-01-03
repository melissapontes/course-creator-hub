// Tests for src/features/courses/domain/usecases/GetPublishedCoursesUseCase.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetPublishedCoursesUseCase } from '@/features/courses/domain/usecases/GetPublishedCoursesUseCase';
import { createMockCourseRepository } from '@tests/helpers/mocks';
import { createMockCourseWithRating, createMockCourseList, createMockCourseFilters } from '@tests/helpers/factories';
import { mockDate, restoreDate } from '@tests/setup';

describe('GetPublishedCoursesUseCase', () => {
  let useCase: GetPublishedCoursesUseCase;
  let mockRepository: ReturnType<typeof createMockCourseRepository>;

  beforeEach(() => {
    mockRepository = createMockCourseRepository();
    useCase = new GetPublishedCoursesUseCase(mockRepository);
  });

  describe('without filters', () => {
    it('should return all published courses when no filters provided', async () => {
      const mockCourses = createMockCourseList(5);
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute();

      expect(mockRepository.getPublishedCourses).toHaveBeenCalled();
      expect(result).toHaveLength(5);
    });

    it('should return empty array when no courses exist', async () => {
      mockRepository.getPublishedCourses.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
    });
  });

  describe('search filter', () => {
    it('should filter courses by title', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', title: 'React Course' }),
        createMockCourseWithRating({ id: '2', title: 'Vue Course' }),
        createMockCourseWithRating({ id: '3', title: 'React Advanced' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ search: 'React' }));

      expect(result).toHaveLength(2);
      expect(result.every(c => c.title.includes('React'))).toBe(true);
    });

    it('should filter courses by subtitle', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', title: 'Course 1', subtitle: 'Learn JavaScript' }),
        createMockCourseWithRating({ id: '2', title: 'Course 2', subtitle: 'Learn Python' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ search: 'JavaScript' }));

      expect(result).toHaveLength(1);
      expect(result[0].subtitle).toContain('JavaScript');
    });

    it('should filter courses by description', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', title: 'Course 1', description: 'Build web apps with Node.js' }),
        createMockCourseWithRating({ id: '2', title: 'Course 2', description: 'Mobile development' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ search: 'Node.js' }));

      expect(result).toHaveLength(1);
    });

    it('should be case insensitive', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', title: 'REACT Course' }),
        createMockCourseWithRating({ id: '2', title: 'react basics' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ search: 'ReAcT' }));

      expect(result).toHaveLength(2);
    });
  });

  describe('category filter', () => {
    it('should filter courses by category', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', category: 'Tecnologia' }),
        createMockCourseWithRating({ id: '2', category: 'Negócios' }),
        createMockCourseWithRating({ id: '3', category: 'Tecnologia' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ category: 'Tecnologia' }));

      expect(result).toHaveLength(2);
      expect(result.every(c => c.category === 'Tecnologia')).toBe(true);
    });

    it('should return all courses when category is "all"', async () => {
      const mockCourses = createMockCourseList(3);
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ category: 'all' }));

      expect(result).toHaveLength(3);
    });
  });

  describe('level filter', () => {
    it('should filter courses by level', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', level: 'INICIANTE' }),
        createMockCourseWithRating({ id: '2', level: 'AVANCADO' }),
        createMockCourseWithRating({ id: '3', level: 'INICIANTE' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ level: 'INICIANTE' }));

      expect(result).toHaveLength(2);
      expect(result.every(c => c.level === 'INICIANTE')).toBe(true);
    });

    it('should return all courses when level is "all"', async () => {
      const mockCourses = createMockCourseList(3);
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ level: 'all' }));

      expect(result).toHaveLength(3);
    });
  });

  describe('date filter', () => {
    beforeEach(() => {
      mockDate('2024-06-15T12:00:00Z');
    });

    afterEach(() => {
      restoreDate();
    });

    it('should filter courses created today', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', createdAt: '2024-06-15T10:00:00Z' }), // today
        createMockCourseWithRating({ id: '2', createdAt: '2024-06-14T10:00:00Z' }), // yesterday
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ dateFilter: 'today' }));

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter courses created within last week', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', createdAt: '2024-06-14T10:00:00Z' }), // 1 day ago
        createMockCourseWithRating({ id: '2', createdAt: '2024-06-10T10:00:00Z' }), // 5 days ago
        createMockCourseWithRating({ id: '3', createdAt: '2024-06-01T10:00:00Z' }), // 14 days ago
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ dateFilter: 'week' }));

      expect(result).toHaveLength(2);
    });

    it('should filter courses created within last month', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', createdAt: '2024-06-10T10:00:00Z' }), // 5 days ago
        createMockCourseWithRating({ id: '2', createdAt: '2024-05-20T10:00:00Z' }), // 26 days ago
        createMockCourseWithRating({ id: '3', createdAt: '2024-05-01T10:00:00Z' }), // 45 days ago
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ dateFilter: 'month' }));

      expect(result).toHaveLength(2);
    });
  });

  describe('sorting', () => {
    it('should sort by most recent first', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', createdAt: '2024-01-01T00:00:00Z' }),
        createMockCourseWithRating({ id: '2', createdAt: '2024-06-01T00:00:00Z' }),
        createMockCourseWithRating({ id: '3', createdAt: '2024-03-01T00:00:00Z' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ sortBy: 'recent' }));

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1');
    });

    it('should sort by oldest first', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', createdAt: '2024-06-01T00:00:00Z' }),
        createMockCourseWithRating({ id: '2', createdAt: '2024-01-01T00:00:00Z' }),
        createMockCourseWithRating({ id: '3', createdAt: '2024-03-01T00:00:00Z' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ sortBy: 'oldest' }));

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1');
    });

    it('should sort by title ascending', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', title: 'Zebra Course' }),
        createMockCourseWithRating({ id: '2', title: 'Alpha Course' }),
        createMockCourseWithRating({ id: '3', title: 'Beta Course' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ sortBy: 'title_asc' }));

      expect(result[0].title).toBe('Alpha Course');
      expect(result[1].title).toBe('Beta Course');
      expect(result[2].title).toBe('Zebra Course');
    });

    it('should sort by title descending', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', title: 'Alpha Course' }),
        createMockCourseWithRating({ id: '2', title: 'Zebra Course' }),
        createMockCourseWithRating({ id: '3', title: 'Beta Course' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({ sortBy: 'title_desc' }));

      expect(result[0].title).toBe('Zebra Course');
      expect(result[1].title).toBe('Beta Course');
      expect(result[2].title).toBe('Alpha Course');
    });
  });

  describe('combined filters', () => {
    it('should apply multiple filters together', async () => {
      const mockCourses = [
        createMockCourseWithRating({ id: '1', title: 'React Course', category: 'Tecnologia', level: 'INICIANTE' }),
        createMockCourseWithRating({ id: '2', title: 'React Advanced', category: 'Tecnologia', level: 'AVANCADO' }),
        createMockCourseWithRating({ id: '3', title: 'Vue Course', category: 'Tecnologia', level: 'INICIANTE' }),
        createMockCourseWithRating({ id: '4', title: 'React Business', category: 'Negócios', level: 'INICIANTE' }),
      ];
      mockRepository.getPublishedCourses.mockResolvedValue(mockCourses);

      const result = await useCase.execute(createMockCourseFilters({
        search: 'React',
        category: 'Tecnologia',
        level: 'INICIANTE',
      }));

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });
});
