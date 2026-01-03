// Domain Entity: Enrollment
// Represents a student's enrollment in a course

export type EnrollmentStatus = 'ATIVO' | 'CANCELADO';

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentWithProgress extends Enrollment {
  course: {
    id: string;
    title: string;
    subtitle: string | null;
    thumbnailUrl: string | null;
    level: string;
    category: string;
  };
  totalLessons: number;
  completedLessons: number;
}
