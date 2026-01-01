// RBAC - Role Based Access Control
export type AppRole = 'PROFESSOR' | 'ESTUDANTE' | 'ADMIN';

export const ROLES = {
  PROFESSOR: 'PROFESSOR' as const,
  ESTUDANTE: 'ESTUDANTE' as const,
  ADMIN: 'ADMIN' as const,
};

export const ROLE_LABELS: Record<AppRole, string> = {
  PROFESSOR: 'Professor',
  ESTUDANTE: 'Estudante',
  ADMIN: 'Administrador',
};

// Permissions by role
export const PERMISSIONS: Record<string, readonly AppRole[]> = {
  // Course Management
  CREATE_COURSE: ['PROFESSOR', 'ADMIN'] as const,
  EDIT_COURSE: ['PROFESSOR', 'ADMIN'] as const,
  DELETE_COURSE: ['PROFESSOR', 'ADMIN'] as const,
  PUBLISH_COURSE: ['PROFESSOR', 'ADMIN'] as const,
  
  // Section/Lesson Management
  MANAGE_SECTIONS: ['PROFESSOR', 'ADMIN'] as const,
  MANAGE_LESSONS: ['PROFESSOR', 'ADMIN'] as const,
  UPLOAD_VIDEO: ['PROFESSOR', 'ADMIN'] as const,
  
  // View Access
  VIEW_TEACHER_DASHBOARD: ['PROFESSOR', 'ADMIN'] as const,
  VIEW_STUDENT_DASHBOARD: ['ESTUDANTE', 'ADMIN'] as const,
  VIEW_ADMIN_DASHBOARD: ['ADMIN'] as const,
  
  // User Management
  MANAGE_USERS: ['ADMIN'] as const,
  VIEW_ALL_USERS: ['ADMIN'] as const,
};

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: AppRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[permission].includes(role);
}

export function hasAnyRole(userRole: AppRole | null | undefined, roles: AppRole[]): boolean {
  if (!userRole) return false;
  return roles.includes(userRole);
}

export function canAccessRoute(role: AppRole | null | undefined, route: string): boolean {
  if (!role) {
    // Public routes
    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/courses'];
    return publicRoutes.some(r => route === r || route.startsWith('/courses/'));
  }

  // Teacher routes
  if (route.startsWith('/teacher')) {
    return hasAnyRole(role, ['PROFESSOR', 'ADMIN']);
  }

  // Student routes
  if (route.startsWith('/student')) {
    return hasAnyRole(role, ['ESTUDANTE', 'ADMIN']);
  }

  // Admin routes
  if (route.startsWith('/admin')) {
    return role === 'ADMIN';
  }

  return true;
}

export function getDefaultRouteForRole(role: AppRole | null | undefined): string {
  switch (role) {
    case 'PROFESSOR':
      return '/teacher';
    case 'ESTUDANTE':
      return '/student';
    case 'ADMIN':
      return '/admin';
    default:
      return '/';
  }
}
