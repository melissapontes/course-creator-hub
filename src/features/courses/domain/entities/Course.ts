// Domain Entity: Course
// Pure domain model for course data

export type CourseLevel = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';
export type CourseStatus = 'RASCUNHO' | 'PUBLICADO';

export interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  category: string;
  level: CourseLevel;
  language: string;
  status: CourseStatus;
  price: number;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseWithInstructor extends Course {
  instructorName: string;
}

export interface CourseWithRating extends CourseWithInstructor {
  averageRating: number;
  ratingCount: number;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  order: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  order: number;
  contentType: 'YOUTUBE_LINK' | 'VIDEO_UPLOAD' | 'TEXTO' | 'QUIZ';
  videoFileUrl: string | null;
  youtubeUrl: string | null;
  textContent: string | null;
  durationSeconds: number | null;
  isPreviewFree: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRating {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFilters {
  search: string;
  category: string;
  level: string;
  dateFilter: string;
  sortBy: string;
}

export const COURSE_CATEGORIES = [
  'Tecnologia',
  'Negócios',
  'Design',
  'Marketing',
  'Desenvolvimento Pessoal',
  'Música',
  'Fotografia',
  'Saúde',
  'Idiomas',
  'Outros',
] as const;

export const COURSE_LEVELS: { value: CourseLevel; label: string }[] = [
  { value: 'INICIANTE', label: 'Iniciante' },
  { value: 'INTERMEDIARIO', label: 'Intermediário' },
  { value: 'AVANCADO', label: 'Avançado' },
];

export function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    INICIANTE: 'Iniciante',
    INTERMEDIARIO: 'Intermediário',
    AVANCADO: 'Avançado',
  };
  return labels[level] || level;
}
