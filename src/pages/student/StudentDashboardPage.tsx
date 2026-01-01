import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, GraduationCap, Clock, ChevronRight, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type EnrolledCourse = {
  id: string;
  course_id: string;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    subtitle: string | null;
    thumbnail_url: string | null;
    level: string;
    category: string | null;
  };
  progress: number;
  completedLessons: number;
  totalLessons: number;
};

export default function StudentDashboardPage() {
  const { authUser, user } = useAuth();

  // Fetch enrollments with course data
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['student-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          enrolled_at,
          courses (
            id,
            title,
            subtitle,
            thumbnail_url,
            level,
            category
          )
        `)
        .eq('user_id', user!.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch lesson progress for all enrolled courses
  const { data: allProgress } = useQuery({
    queryKey: ['student-all-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('course_id, lesson_id, completed')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch lesson counts for enrolled courses
  const { data: lessonCounts } = useQuery({
    queryKey: ['student-lesson-counts', enrollments?.map((e) => e.course_id)],
    queryFn: async () => {
      if (!enrollments?.length) return {};
      
      const courseIds = enrollments.map((e) => e.course_id);
      
      // Get sections for these courses
      const { data: sections } = await supabase
        .from('sections')
        .select('id, course_id')
        .in('course_id', courseIds);

      if (!sections?.length) return {};

      // Get lesson counts per section
      const sectionIds = sections.map((s) => s.id);
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, section_id')
        .in('section_id', sectionIds);

      // Map lessons to courses
      const counts: Record<string, number> = {};
      courseIds.forEach((courseId) => {
        const courseSections = sections.filter((s) => s.course_id === courseId);
        const courseSectionIds = courseSections.map((s) => s.id);
        const courseLessons = lessons?.filter((l) => courseSectionIds.includes(l.section_id)) || [];
        counts[courseId] = courseLessons.length;
      });

      return counts;
    },
    enabled: !!enrollments?.length,
  });

  // Combine data
  const enrolledCourses: EnrolledCourse[] = (enrollments || []).map((enrollment) => {
    const courseId = enrollment.course_id;
    const totalLessons = lessonCounts?.[courseId] || 0;
    const courseProgress = allProgress?.filter((p) => p.course_id === courseId) || [];
    const completedLessons = courseProgress.filter((p) => p.completed).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      id: enrollment.id,
      course_id: courseId,
      enrolled_at: enrollment.enrolled_at,
      course: enrollment.courses as any,
      progress,
      completedLessons,
      totalLessons,
    };
  });

  // Fetch published courses for recommendations (exclude enrolled)
  const enrolledCourseIds = enrolledCourses.map((e) => e.course_id);
  const { data: recommendedCourses, isLoading: recommendedLoading } = useQuery({
    queryKey: ['recommended-courses', enrolledCourseIds],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('*')
        .eq('status', 'PUBLICADO')
        .order('created_at', { ascending: false })
        .limit(4);

      if (enrolledCourseIds.length > 0) {
        query = query.not('id', 'in', `(${enrolledCourseIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const totalEnrolled = enrolledCourses.length;
  const totalCompleted = allProgress?.filter((p) => p.completed).length || 0;
  const inProgressCourses = enrolledCourses.filter((c) => c.progress > 0 && c.progress < 100);

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      INICIANTE: 'Iniciante',
      INTERMEDIARIO: 'Intermediário',
      AVANCADO: 'Avançado',
    };
    return labels[level] || level;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Olá, {authUser?.profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Continue sua jornada de aprendizado
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Matriculados
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {enrollmentsLoading ? <Skeleton className="h-8 w-12" /> : totalEnrolled}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {inProgressCourses.length} em andamento
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aulas Concluídas
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalCompleted}</div>
              <p className="text-xs text-muted-foreground mt-1">Continue assim!</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progresso Médio
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {enrolledCourses.length > 0
                  ? Math.round(
                      enrolledCourses.reduce((acc, c) => acc + c.progress, 0) / enrolledCourses.length
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">Média de conclusão</p>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Continue Estudando
            </h2>
            {enrolledCourses.length > 0 && (
              <Link to="/student/courses">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {enrollmentsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {enrolledCourses.slice(0, 4).map((enrollment) => (
                <Link key={enrollment.id} to={`/learn/${enrollment.course_id}`}>
                  <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {enrollment.course.thumbnail_url ? (
                            <img
                              src={enrollment.course.thumbnail_url}
                              alt={enrollment.course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {enrollment.course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {enrollment.course.subtitle || enrollment.course.category || 'Curso'}
                          </p>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">
                                {enrollment.completedLessons}/{enrollment.totalLessons} aulas
                              </span>
                              <span className="font-medium">{enrollment.progress}%</span>
                            </div>
                            <Progress value={enrollment.progress} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-4">
                        <Play className="w-3 h-3 mr-2" />
                        Continuar
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">Nenhum curso em andamento</CardTitle>
                <CardDescription className="mb-4">
                  Explore nosso catálogo e comece a aprender algo novo
                </CardDescription>
                <Link to="/courses">
                  <Button>Explorar Cursos</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommended Courses */}
        {recommendedCourses && recommendedCourses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-foreground">
                Cursos Recomendados
              </h2>
              <Link to="/courses">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {recommendedLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <Skeleton className="h-32 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {recommendedCourses.map((course) => (
                  <Link key={course.id} to={`/courses/${course.id}`}>
                    <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                      <div className="h-32 bg-muted flex items-center justify-center">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-foreground truncate">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {course.subtitle || 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {getLevelLabel(course.level)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
