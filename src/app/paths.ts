// Route path constants
export const PATHS = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  COURSES: '/courses',
  COURSE_DETAIL: (id: string) => `/courses/${id}`,

  // Teacher
  TEACHER: {
    ROOT: '/teacher',
    COURSES: '/teacher/courses',
    COURSE_NEW: '/teacher/courses/new',
    COURSE_EDIT: (id: string) => `/teacher/courses/${id}/edit`,
    COURSE_SECTIONS: (id: string) => `/teacher/courses/${id}/sections`,
    LESSON_EDIT: (courseId: string, lessonId: string) => `/teacher/courses/${courseId}/lessons/${lessonId}/edit`,
  },

  // Student
  STUDENT: {
    ROOT: '/student',
    COURSES: '/student/courses',
    COURSE_WATCH: (courseId: string, lessonId: string) => `/student/courses/${courseId}/watch/${lessonId}`,
  },

  // Admin
  ADMIN: {
    ROOT: '/admin',
    USERS: '/admin/users',
    COURSES: '/admin/courses',
  },
} as const;
