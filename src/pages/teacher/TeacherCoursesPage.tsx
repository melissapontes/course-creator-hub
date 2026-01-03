import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusCircle, BookOpen, MoreVertical, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export default function TeacherCoursesPage() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['teacher-courses', authUser?.id],
    queryFn: async () => {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', authUser!.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch enrollments count for each course
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('course_id');

      if (enrollmentsError) throw enrollmentsError;

      // Count enrollments per course
      const enrollmentCounts = (enrollments || []).reduce((acc, e) => {
        acc[e.course_id] = (acc[e.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (coursesData || []).map(course => ({
        ...course,
        salesCount: enrollmentCounts[course.id] || 0,
      }));
    },
    enabled: !!authUser?.id,
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'PUBLICADO' ? 'RASCUNHO' : 'PUBLICADO';
      const { error } = await supabase.from('courses').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast.success(newStatus === 'PUBLICADO' ? 'Curso publicado!' : 'Curso despublicado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status do curso');
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast.success('Curso excluído com sucesso');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir curso');
    },
  });

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Meus Cursos</h1>
            <p className="text-muted-foreground mt-1">Gerencie todos os seus cursos</p>
          </div>
          <Link to="/teacher/courses/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Curso
            </Button>
          </Link>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="h-40 bg-muted flex items-center justify-center relative">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-muted-foreground" />
                  )}
                  <Badge
                    className={`absolute top-3 right-3 ${
                      course.status === 'PUBLICADO'
                        ? 'bg-success text-success-foreground'
                        : 'bg-warning text-warning-foreground'
                    }`}
                  >
                    {course.status === 'PUBLICADO' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {course.subtitle || 'Sem descrição'}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/learn/${course.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Curso
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toggleStatus.mutate({ id: course.id, currentStatus: course.status })
                          }
                        >
                          {course.status === 'PUBLICADO' ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Despublicar
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Publicar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(course.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getLevelLabel(course.level)}
                      </Badge>
                      {course.category && (
                        <Badge variant="outline" className="text-xs">
                          {course.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-sm font-semibold text-primary">
                      R$ {Number(course.price || 0).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {course.salesCount} {course.salesCount === 1 ? 'venda' : 'vendas'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum curso criado</h3>
              <p className="text-muted-foreground mb-6">
                Comece criando seu primeiro curso e compartilhe seu conhecimento
              </p>
              <Link to="/teacher/courses/new">
                <Button size="lg">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Criar Primeiro Curso
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O curso e todo seu conteúdo serão permanentemente
              excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteCourse.mutate(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
