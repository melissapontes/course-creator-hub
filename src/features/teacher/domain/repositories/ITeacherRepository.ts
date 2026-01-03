// Domain Repository Interface: ITeacherRepository

import { TeacherSalesData, TeacherCourse } from '../entities';

export interface ITeacherRepository {
  getTeacherCourses(instructorId: string): Promise<TeacherCourse[]>;
  getTeacherSales(instructorId: string): Promise<TeacherSalesData>;
  toggleCourseStatus(courseId: string, currentStatus: string): Promise<string>;
  deleteCourse(courseId: string): Promise<void>;
}
