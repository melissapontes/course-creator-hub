// Supabase Admin Data Source Implementation
// Handles all admin-related database operations

import { supabase } from '@/integrations/supabase/client';
import { AdminDashboardData, ProfessorData, StudentData } from '../../domain/entities';

export class SupabaseAdminDataSource {
  async getDashboardData(): Promise<AdminDashboardData> {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        courses (
          id,
          price,
          instructor_id
        )
      `);

    if (enrollmentsError) throw enrollmentsError;

    const { data: courses } = await supabase
      .from('courses')
      .select('id, instructor_id');

    const { data: professors } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'PROFESSOR');

    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ESTUDANTE');

    let totalRevenue = 0;
    enrollments?.forEach((enrollment: any) => {
      const course = enrollment.courses;
      if (course) {
        totalRevenue += Number(course.price) || 0;
      }
    });

    return {
      financials: {
        totalRevenue,
        professorShare: totalRevenue * 0.85,
        platformShare: totalRevenue * 0.10,
        gatewayShare: totalRevenue * 0.05,
      },
      stats: {
        totalEnrollments: enrollments?.length || 0,
        totalProfessors: professors?.length || 0,
        totalStudents: students?.length || 0,
        totalCourses: courses?.length || 0,
      },
    };
  }

  async getProfessorsData(): Promise<{
    professors: ProfessorData[];
    totalProfessors: number;
    totalCourses: number;
    totalPaidToProfessors: number;
  }> {
    const { data: professorsData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'PROFESSOR');

    const { data: coursesData } = await supabase.from('courses').select('id, instructor_id, price');
    const { data: enrollmentsData } = await supabase.from('enrollments').select('course_id');

    const professorStats: Record<string, ProfessorData> = {};

    professorsData?.forEach((prof) => {
      professorStats[prof.id] = {
        id: prof.id,
        fullName: prof.full_name,
        email: prof.email,
        coursesCount: 0,
        enrollmentsCount: 0,
        totalSales: 0,
        professorShare: 0,
        platformShare: 0,
      };
    });

    const courseOwnerMap: Record<string, string> = {};
    const coursePriceMap: Record<string, number> = {};

    coursesData?.forEach((course) => {
      courseOwnerMap[course.id] = course.instructor_id;
      coursePriceMap[course.id] = Number(course.price) || 0;
      if (professorStats[course.instructor_id]) {
        professorStats[course.instructor_id].coursesCount++;
      }
    });

    enrollmentsData?.forEach((enrollment) => {
      const ownerId = courseOwnerMap[enrollment.course_id];
      const price = coursePriceMap[enrollment.course_id] || 0;
      if (ownerId && professorStats[ownerId]) {
        professorStats[ownerId].enrollmentsCount++;
        professorStats[ownerId].totalSales += price;
      }
    });

    let totalPaidToProfessors = 0;
    Object.values(professorStats).forEach((prof) => {
      prof.professorShare = prof.totalSales * 0.85;
      prof.platformShare = prof.totalSales * 0.10;
      totalPaidToProfessors += prof.professorShare;
    });

    const professors = Object.values(professorStats).sort((a, b) => b.totalSales - a.totalSales);

    return {
      professors,
      totalProfessors: professors.length,
      totalCourses: coursesData?.length || 0,
      totalPaidToProfessors,
    };
  }

  async getStudentsData(): Promise<{
    students: StudentData[];
    studentsWithPurchases: StudentData[];
    totalStudents: number;
    totalBuyers: number;
    totalSpent: number;
  }> {
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'ESTUDANTE');

    const { data: coursesData } = await supabase.from('courses').select('id, price');
    const { data: enrollmentsData } = await supabase.from('enrollments').select('user_id, course_id, enrolled_at');

    const coursePriceMap: Record<string, number> = {};
    coursesData?.forEach((course) => {
      coursePriceMap[course.id] = Number(course.price) || 0;
    });

    const studentStats: Record<string, StudentData> = {};

    studentsData?.forEach((student) => {
      studentStats[student.id] = {
        id: student.id,
        fullName: student.full_name,
        email: student.email,
        coursesCount: 0,
        totalSpent: 0,
        enrolledAt: '',
      };
    });

    enrollmentsData?.forEach((enrollment) => {
      if (studentStats[enrollment.user_id]) {
        studentStats[enrollment.user_id].coursesCount++;
        studentStats[enrollment.user_id].totalSpent += coursePriceMap[enrollment.course_id] || 0;
        if (!studentStats[enrollment.user_id].enrolledAt || enrollment.enrolled_at < studentStats[enrollment.user_id].enrolledAt) {
          studentStats[enrollment.user_id].enrolledAt = enrollment.enrolled_at;
        }
      }
    });

    const students = Object.values(studentStats).sort((a, b) => b.totalSpent - a.totalSpent);
    const studentsWithPurchases = students.filter((s) => s.coursesCount > 0);
    const totalSpent = students.reduce((sum, s) => sum + s.totalSpent, 0);

    return {
      students,
      studentsWithPurchases,
      totalStudents: students.length,
      totalBuyers: studentsWithPurchases.length,
      totalSpent,
    };
  }
}
