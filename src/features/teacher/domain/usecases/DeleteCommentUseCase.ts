// Use Case: Delete a comment (professor moderation)

import { ITeacherRepository } from '../repositories/ITeacherRepository';

export class DeleteCommentUseCase {
  constructor(private readonly teacherRepository: ITeacherRepository) {}

  async execute(commentId: string): Promise<void> {
    return this.teacherRepository.deleteComment(commentId);
  }
}
