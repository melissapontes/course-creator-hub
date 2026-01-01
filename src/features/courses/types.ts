export type CourseLevel = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';
export type CourseStatus = 'RASCUNHO' | 'PUBLICADO';
export type ContentType = 'VIDEO_UPLOAD' | 'YOUTUBE_LINK';

export interface Course {
  id: string;
  instructor_id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  level: CourseLevel;
  language: string | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface CourseWithInstructor extends Course {
  instructor?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface Section {
  id: string;
  course_id: string;
  title: string;
  order: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  order: number;
  content_type: ContentType;
  video_file_url: string | null;
  youtube_url: string | null;
  duration_seconds: number | null;
  is_preview_free: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectionWithLessons extends Section {
  lessons: Lesson[];
}

export interface CourseWithContent extends CourseWithInstructor {
  sections: SectionWithLessons[];
}

// Form types
export interface CreateCourseInput {
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  level: CourseLevel;
  language?: string;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
  status?: CourseStatus;
  thumbnail_url?: string;
}

export interface CreateSectionInput {
  course_id: string;
  title: string;
  order?: number;
}

export interface CreateLessonInput {
  section_id: string;
  title: string;
  order?: number;
  content_type: ContentType;
  video_file_url?: string;
  youtube_url?: string;
  duration_seconds?: number;
  is_preview_free?: boolean;
}

export interface UpdateLessonInput extends Partial<Omit<CreateLessonInput, 'section_id'>> {}

// Category options
export const COURSE_CATEGORIES = [
  'Programação',
  'Design',
  'Marketing',
  'Negócios',
  'Música',
  'Fotografia',
  'Idiomas',
  'Desenvolvimento Pessoal',
  'Saúde e Fitness',
  'Outros',
] as const;

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

export const STATUS_LABELS: Record<CourseStatus, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
};
