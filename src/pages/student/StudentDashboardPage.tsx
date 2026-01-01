import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, GraduationCap, Clock, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type EnrolledCourse = {
  id: string;
  course_id: string;
  enrolled_at: string;
  status: string;
  course: {
    id: string;
    title: string;
    subtitle: string | null;
    thumbnail_url: string | null;
    level: string;
    category: string;
  };
  totalLessons: number;
  completedLessons: number;
};

export default function StudentDashboardPage() {
  const { authUser } = useAuth();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['student-enrollments', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return [];

      // Get enrollments with course data
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          enrolled_at,
          status,
          courses:course_id (
            id,
            title,
            subtitle,
            thumbnail_url,
            level,
            category
          )
        `)
        .eq('user_id', authUser.id)
        .eq('status', 'ATIVO');

      if (enrollmentError) throw enrollmentError;
      if (!enrollmentData) return [];

      // Get progress for each enrollment
      const enrollmentsWithProgress = await Promise.all(
        enrollmentData.map(async (enrollment) => {
          // Get all lessons for this course
          const { data: sections } = await supabase
            .from('sections')
            .select('id')
            .eq('course_id', enrollment.course_id);

          if (!sections || sections.length === 0) {
            return {
              ...enrollment,
              course: enrollment.courses,
              totalLessons: 0,
              completedLessons: 0,
            };
          }

          const sectionIds = sections.map((s) => s.id);

          const { count: totalLessons } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .in('section_id', sectionIds);

          // Get completed lessons
          const { data: lessonIds } = await supabase
            .from('lessons')
            .select('id')
            .in('section_id', sectionIds);

          let completedLessons = 0;
          if (lessonIds && lessonIds.length > 0) {
            const { count } = await supabase
              .from('lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', authUser.id)
              .eq('completed', true)
              .in('lesson_id', lessonIds.map((l) => l.id));

            completedLessons = count || 0;
          }

          return {
            ...enrollment,
            course: enrollment.courses,
            totalLessons: totalLessons || 0,
            completedLessons,
          };
        })
      );

      return enrollmentsWithProgress as EnrolledCourse[];
    },
    enabled: !!authUser?.id,
  });

  const stats = {
    totalCourses: enrollments?.length || 0,
    completedCourses: enrollments?.filter(
      (e) => e.totalLessons > 0 && e.completedLessons === e.totalLessons
    ).length || 0,
    inProgressCourses: enrollments?.filter(
      (e) => e.completedLessons > 0 && e.completedLessons < e.totalLessons
    ).length || 0,
    averageProgress:
      enrollments && enrollments.length > 0
        ? Math.round(
            enrollments.reduce((acc, e) => {
              if (e.totalLessons === 0) return acc;
              return acc + (e.completedLessons / e.totalLessons) * 100;
            }, 0) / enrollments.filter((e) => e.totalLessons > 0).length || 0
          )
        : 0,
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Meu Painel</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seu progresso e continue aprendendo
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCourses}</p>
                  <p className="text-sm text-muted-foreground">Cursos Matriculados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.completedCourses}</p>
                  <p className="text-sm text-muted-foreground">Cursos Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.inProgressCourses}</p>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <GraduationCap className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.averageProgress}%</p>
                  <p className="text-sm text-muted-foreground">Progresso Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-4 border border-border rounded-lg">
                    <Skeleton className="w-32 h-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : enrollments && enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.map((enrollment) => {
                  const progress =
                    enrollment.totalLessons > 0
                      ? Math.round((enrollment.completedLessons / enrollment.totalLessons) * 100)
                      : 0;

                  return (
                    <div
                      key={enrollment.id}
                      className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        {enrollment.course?.thumbnail_url ? (
                          <img
                            src={enrollment.course.thumbnail_url}
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {enrollment.course?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.course?.category} • {getLevelLabel(enrollment.course?.level || '')}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={progress} className="flex-1 h-2" />
                          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            {progress}% concluído
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {enrollment.completedLessons} de {enrollment.totalLessons} aulas
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <Link to={`/learn/${enrollment.course_id}`}>
                          <Button size="sm">
                            <Play className="w-4 h-4 mr-1" />
                            Continuar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhum curso matriculado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Explore nosso catálogo e encontre o curso perfeito para você
                </p>
                <Link to="/courses">
                  <Button>
                    <Play className="w-4 h-4 mr-2" />
                    Explorar Cursos
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
