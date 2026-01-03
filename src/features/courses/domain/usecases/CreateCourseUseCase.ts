// Use Case: Create Course
// Creates a new course for a teacher

import { ICourseRepository } from '../repositories/ICourseRepository';
import { Course, CourseLevel, CourseStatus } from '../entities';

export interface CreateCourseInput {
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  level: CourseLevel;
  language?: string;
  price?: number;
  instructorId: string;
}

export class CreateCourseUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async execute(input: CreateCourseInput): Promise<Course> {
    if (!input.title || input.title.trim().length < 3) {
      throw new Error('O título deve ter pelo menos 3 caracteres');
    }

    if (!input.category) {
      throw new Error('Categoria é obrigatória');
    }

    const courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'> = {
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      description: input.description?.trim() || null,
      thumbnailUrl: null,
      category: input.category,
      level: input.level,
      language: input.language || 'Português',
      status: 'RASCUNHO' as CourseStatus,
      price: input.price || 0,
      instructorId: input.instructorId,
    };

    return this.courseRepository.createCourse(courseData);
  }
}
