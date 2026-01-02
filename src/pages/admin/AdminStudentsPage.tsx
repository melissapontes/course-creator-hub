import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ShoppingCart, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentData {
  id: string;
  fullName: string;
  email: string;
  coursesCount: number;
  totalSpent: number;
  enrolledAt: string;
}

export default function AdminStudentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-students-data'],
    queryFn: async () => {
      // Get all students
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'ESTUDANTE');

      if (studentsError) throw studentsError;

      // Get all courses for price lookup
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, price, title');

      if (coursesError) throw coursesError;

      // Get all enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, course_id, user_id, enrolled_at');

      if (enrollError) throw enrollError;

      // Build student data
      const studentData: StudentData[] = students?.map(student => {
        const studentEnrollments = enrollments?.filter(e => e.user_id === student.id) || [];
        
        let totalSpent = 0;
        studentEnrollments.forEach(enrollment => {
          const course = courses?.find(c => c.id === enrollment.course_id);
          if (course) {
            totalSpent += Number(course.price) || 0;
          }
        });

        const lastEnrollment = studentEnrollments.sort((a, b) => 
          new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
        )[0];

        return {
          id: student.id,
          fullName: student.full_name,
          email: student.email,
          coursesCount: studentEnrollments.length,
          totalSpent,
          enrolledAt: lastEnrollment?.enrolled_at || ''
        };
      }) || [];

      // Filter students who have made purchases
      const studentsWithPurchases = studentData.filter(s => s.coursesCount > 0);
      const totalStudents = students?.length || 0;
      const totalBuyers = studentsWithPurchases.length;
      const totalSpentAll = studentData.reduce((sum, s) => sum + s.totalSpent, 0);

      return {
        students: studentData.sort((a, b) => b.totalSpent - a.totalSpent),
        studentsWithPurchases: studentsWithPurchases.sort((a, b) => b.totalSpent - a.totalSpent),
        totalStudents,
        totalBuyers,
        totalSpentAll
      };
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Estudantes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento e métricas de estudantes da plataforma
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Estudantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {data?.totalStudents || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compradores</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {data?.totalBuyers || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Estudantes que compraram cursos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(data?.totalSpentAll || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Valor total das compras
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students with Purchases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Estudantes com Compras</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.studentsWithPurchases && data.studentsWithPurchases.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudante</TableHead>
                    <TableHead className="text-center">Cursos Comprados</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                    <TableHead className="text-right">Última Compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.studentsWithPurchases.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.fullName}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{student.coursesCount}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(student.totalSpent)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(student.enrolledAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum estudante realizou compras ainda.
              </p>
            )}
          </CardContent>
        </Card>

        {/* All Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Estudantes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.students && data.students.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudante</TableHead>
                    <TableHead className="text-center">Cursos</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.fullName}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{student.coursesCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(student.totalSpent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum estudante cadastrado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
