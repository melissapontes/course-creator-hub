// Domain Entity: Admin Statistics
// Pure domain model for admin dashboard data

export interface PlatformFinancials {
  totalRevenue: number;
  professorShare: number;
  platformShare: number;
  gatewayShare: number;
}

export interface PlatformStats {
  totalEnrollments: number;
  totalProfessors: number;
  totalStudents: number;
  totalCourses: number;
}

export interface AdminDashboardData {
  financials: PlatformFinancials;
  stats: PlatformStats;
}

export interface ProfessorData {
  id: string;
  fullName: string;
  email: string;
  coursesCount: number;
  enrollmentsCount: number;
  totalSales: number;
  professorShare: number;
  platformShare: number;
}

export interface StudentData {
  id: string;
  fullName: string;
  email: string;
  coursesCount: number;
  totalSpent: number;
  enrolledAt: string;
}
