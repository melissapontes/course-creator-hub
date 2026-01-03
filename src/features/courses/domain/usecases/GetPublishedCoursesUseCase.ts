// Use Case: Get Published Courses
// Fetches all published courses for the catalog

import { ICourseRepository } from '../repositories/ICourseRepository';
import { CourseWithRating, CourseFilters } from '../entities';

export class GetPublishedCoursesUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async execute(filters?: CourseFilters): Promise<CourseWithRating[]> {
    const courses = await this.courseRepository.getPublishedCourses();
    
    if (!filters) return courses;
    
    return this.applyFilters(courses, filters);
  }

  private applyFilters(courses: CourseWithRating[], filters: CourseFilters): CourseWithRating[] {
    let result = courses;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(searchLower) ||
          course.subtitle?.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      result = result.filter((course) => course.category === filters.category);
    }

    // Level filter
    if (filters.level && filters.level !== 'all') {
      result = result.filter((course) => course.level === filters.level);
    }

    // Date filter
    if (filters.dateFilter && filters.dateFilter !== 'all') {
      const now = new Date();
      result = result.filter((course) => {
        const courseDate = new Date(course.createdAt);
        switch (filters.dateFilter) {
          case 'today':
            return courseDate.toDateString() === now.toDateString();
          case 'week':
            return courseDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case 'month':
            return courseDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          case '3months':
            return courseDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          case 'year':
            return courseDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          default:
            return true;
        }
      });
    }

    // Sort
    if (filters.sortBy) {
      result.sort((a, b) => {
        switch (filters.sortBy) {
          case 'recent':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'title_asc':
            return a.title.localeCompare(b.title);
          case 'title_desc':
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
    }

    return result;
  }
}
