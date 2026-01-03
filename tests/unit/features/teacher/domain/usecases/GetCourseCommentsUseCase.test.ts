// Tests for src/features/teacher/domain/usecases/GetCourseCommentsUseCase.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetCourseCommentsUseCase } from '@/features/teacher/domain/usecases/GetCourseCommentsUseCase';
import { ITeacherRepository } from '@/features/teacher/domain/repositories/ITeacherRepository';
import { CourseComment } from '@/features/teacher/domain/entities/TeacherStats';

describe('GetCourseCommentsUseCase', () => {
  let useCase: GetCourseCommentsUseCase;
  let mockRepository: jest.Mocked<ITeacherRepository>;

  const createMockComment = (overrides: Partial<CourseComment> = {}): CourseComment => ({
    id: 'comment-123',
    content: 'Test comment',
    userId: 'user-123',
    userName: 'Test User',
    userAvatar: null,
    lessonId: 'lesson-123',
    lessonTitle: 'Test Lesson',
    sectionTitle: 'Test Section',
    parentId: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = {
      getTeacherCourses: vi.fn(),
      getTeacherSales: vi.fn(),
      toggleCourseStatus: vi.fn(),
      deleteCourse: vi.fn(),
      getCourseComments: vi.fn(),
      deleteComment: vi.fn(),
    };
    useCase = new GetCourseCommentsUseCase(mockRepository);
  });

  describe('successful fetch', () => {
    it('should return comments for a course', async () => {
      const mockComments = [
        createMockComment({ id: '1', content: 'First comment' }),
        createMockComment({ id: '2', content: 'Second comment' }),
      ];
      mockRepository.getCourseComments.mockResolvedValue(mockComments);

      const result = await useCase.execute('course-123');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('First comment');
      expect(result[1].content).toBe('Second comment');
    });

    it('should call repository with correct course ID', async () => {
      mockRepository.getCourseComments.mockResolvedValue([]);

      await useCase.execute('specific-course-id');

      expect(mockRepository.getCourseComments).toHaveBeenCalledWith('specific-course-id');
    });

    it('should return empty array when no comments exist', async () => {
      mockRepository.getCourseComments.mockResolvedValue([]);

      const result = await useCase.execute('course-no-comments');

      expect(result).toEqual([]);
    });
  });

  describe('comments with replies', () => {
    it('should return comments with nested replies', async () => {
      const mockComments = [
        createMockComment({
          id: '1',
          content: 'Parent comment',
          replies: [
            createMockComment({ id: '1-1', content: 'Reply 1', parentId: '1' }),
            createMockComment({ id: '1-2', content: 'Reply 2', parentId: '1' }),
          ],
        }),
      ];
      mockRepository.getCourseComments.mockResolvedValue(mockComments);

      const result = await useCase.execute('course-123');

      expect(result[0].replies).toHaveLength(2);
      expect(result[0].replies?.[0].content).toBe('Reply 1');
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      const error = new Error('Course not found');
      mockRepository.getCourseComments.mockRejectedValue(error);

      await expect(useCase.execute('invalid-course')).rejects.toThrow('Course not found');
    });
  });
});
