import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, BookOpen, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfessorData {
  id: string;
  fullName: string;
  email: string;
  coursesCount: number;
  enrollmentsCount: number;
  totalSales: number;
  professorShare: number;
  platformShare: number;
}

export default function AdminProfessorsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-professors-data'],
    queryFn: async () => {
      // Get all professors
      const { data: professors, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'PROFESSOR');

      if (profError) throw profError;

      // Get all courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, instructor_id, price, title');

      if (coursesError) throw coursesError;

      // Get all enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, course_id');

      if (enrollError) throw enrollError;

      // Build professor data
      const professorData: ProfessorData[] = professors?.map(prof => {
        const profCourses = courses?.filter(c => c.instructor_id === prof.id) || [];
        const profCourseIds = profCourses.map(c => c.id);
        const profEnrollments = enrollments?.filter(e => profCourseIds.includes(e.course_id)) || [];
        
        let totalSales = 0;
        profEnrollments.forEach(enrollment => {
          const course = courses?.find(c => c.id === enrollment.course_id);
          if (course) {
            totalSales += Number(course.price) || 0;
          }
        });

        return {
          id: prof.id,
          fullName: prof.full_name,
          email: prof.email,
          coursesCount: profCourses.length,
          enrollmentsCount: profEnrollments.length,
          totalSales,
          professorShare: totalSales * 0.85,
          platformShare: totalSales * 0.10
        };
      }) || [];

      const totalProfessors = professorData.length;
      const totalCourses = courses?.length || 0;
      const totalProfessorRevenue = professorData.reduce((sum, p) => sum + p.professorShare, 0);

      return {
        professors: professorData.sort((a, b) => b.totalSales - a.totalSales),
        totalProfessors,
        totalCourses,
        totalProfessorRevenue
      };
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Professores
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento e métricas de professores da plataforma
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Professores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {data?.totalProfessors || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {data?.totalCourses || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pago aos Professores</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.totalProfessorRevenue || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">85% das vendas</p>
            </CardContent>
          </Card>
        </div>

        {/* Professors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Professores</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.professors && data.professors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Professor</TableHead>
                    <TableHead className="text-center">Cursos</TableHead>
                    <TableHead className="text-center">Vendas</TableHead>
                    <TableHead className="text-right">Total Vendido</TableHead>
                    <TableHead className="text-right">Receita Prof. (85%)</TableHead>
                    <TableHead className="text-right">Receita Plataforma (10%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.professors.map((prof) => (
                    <TableRow key={prof.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{prof.fullName}</p>
                          <p className="text-sm text-muted-foreground">{prof.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{prof.coursesCount}</TableCell>
                      <TableCell className="text-center">{prof.enrollmentsCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(prof.totalSales)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(prof.professorShare)}
                      </TableCell>
                      <TableCell className="text-right text-primary">
                        {formatCurrency(prof.platformShare)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum professor cadastrado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
