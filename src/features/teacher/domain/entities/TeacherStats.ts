// Domain Entity: Teacher Stats
// Pure domain model for teacher dashboard data

export interface TeacherSalesData {
  totalSales: number;
  netRevenue: number;
  enrollmentsCount: number;
}

export interface TeacherCourseStats {
  totalCourses: number;
  publishedCount: number;
  draftCount: number;
}

export interface TeacherCourse {
  id: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
  category: string;
  level: string;
  status: string;
  price: number;
  salesCount: number;
  createdAt: string;
}

export interface CourseComment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  lessonId: string;
  lessonTitle: string;
  sectionTitle: string;
  parentId: string | null;
  createdAt: string;
  replies?: CourseComment[];
}
