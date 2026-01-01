import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, BookOpen, Eye, EyeOff, ChevronRight, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherDashboardPage() {
  const { authUser, user } = useAuth();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch enrollment counts for all courses
  const { data: enrollmentCounts } = useQuery({
    queryKey: ['teacher-enrollment-counts', courses?.map((c) => c.id)],
    queryFn: async () => {
      if (!courses?.length) return {};

      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .in('course_id', courses.map((c) => c.id));

      if (error) throw error;

      // Count enrollments per course
      const counts: Record<string, number> = {};
      data.forEach((enrollment) => {
        counts[enrollment.course_id] = (counts[enrollment.course_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!courses?.length,
  });

  const publishedCount = courses?.filter((c) => c.status === 'PUBLICADO').length || 0;
  const draftCount = courses?.filter((c) => c.status === 'RASCUNHO').length || 0;
  const totalStudents = Object.values(enrollmentCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Olá, {authUser?.profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus cursos e acompanhe seu progresso
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Cursos
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-12" /> : courses?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Publicados
              </CardTitle>
              <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {isLoading ? <Skeleton className="h-8 w-12" /> : publishedCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rascunhos
              </CardTitle>
              <EyeOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {isLoading ? <Skeleton className="h-8 w-12" /> : draftCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alunos Matriculados
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {isLoading ? <Skeleton className="h-8 w-12" /> : totalStudents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total em todos os cursos</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/teacher/courses/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Novo Curso
              </Button>
            </Link>
            <Link to="/teacher/courses">
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Ver Todos os Cursos
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Cursos Recentes</h2>
            <Link to="/teacher/courses">
              <Button variant="ghost" size="sm">
                Ver todos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => {
                const studentCount = enrollmentCounts?.[course.id] || 0;
                return (
                  <Link key={course.id} to={`/teacher/courses/${course.id}/edit`}>
                    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {course.thumbnail_url ? (
                              <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BookOpen className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{course.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {course.subtitle || 'Sem descrição'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">{studentCount}</span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              course.status === 'PUBLICADO'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                          >
                            {course.status === 'PUBLICADO' ? 'Publicado' : 'Rascunho'}
                          </span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">Nenhum curso ainda</CardTitle>
                <CardDescription className="mb-4">
                  Comece criando seu primeiro curso
                </CardDescription>
                <Link to="/teacher/courses/new">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar Curso
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
