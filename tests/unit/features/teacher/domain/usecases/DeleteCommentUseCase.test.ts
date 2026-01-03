// Tests for src/features/teacher/domain/usecases/DeleteCommentUseCase.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteCommentUseCase } from '@/features/teacher/domain/usecases/DeleteCommentUseCase';
import { ITeacherRepository } from '@/features/teacher/domain/repositories/ITeacherRepository';

describe('DeleteCommentUseCase', () => {
  let useCase: DeleteCommentUseCase;
  let mockRepository: jest.Mocked<ITeacherRepository>;

  beforeEach(() => {
    mockRepository = {
      getTeacherCourses: vi.fn(),
      getTeacherSales: vi.fn(),
      toggleCourseStatus: vi.fn(),
      deleteCourse: vi.fn(),
      getCourseComments: vi.fn(),
      deleteComment: vi.fn(),
    };
    useCase = new DeleteCommentUseCase(mockRepository);
  });

  describe('successful deletion', () => {
    it('should call repository deleteComment with comment ID', async () => {
      mockRepository.deleteComment.mockResolvedValue(undefined);

      await useCase.execute('comment-123');

      expect(mockRepository.deleteComment).toHaveBeenCalledWith('comment-123');
      expect(mockRepository.deleteComment).toHaveBeenCalledTimes(1);
    });

    it('should resolve without error on success', async () => {
      mockRepository.deleteComment.mockResolvedValue(undefined);

      await expect(useCase.execute('comment-456')).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      const error = new Error('Comment not found');
      mockRepository.deleteComment.mockRejectedValue(error);

      await expect(useCase.execute('non-existent-id')).rejects.toThrow('Comment not found');
    });
  });
});
