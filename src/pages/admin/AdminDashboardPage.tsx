import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, CreditCard, GraduationCap, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['admin-financial-data'],
    queryFn: async () => {
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

      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, instructor_id');

      if (coursesError) throw coursesError;

      const { data: professors, error: profError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'PROFESSOR');

      if (profError) throw profError;

      let totalRevenue = 0;
      enrollments?.forEach((enrollment: any) => {
        const course = enrollment.courses;
        if (course) {
          totalRevenue += Number(course.price) || 0;
        }
      });

      const totalProfessorShare = totalRevenue * 0.85;
      const totalPlatformShare = totalRevenue * 0.10;
      const totalGatewayShare = totalRevenue * 0.05;

      return {
        totalRevenue,
        totalProfessorShare,
        totalPlatformShare,
        totalGatewayShare,
        totalEnrollments: enrollments?.length || 0,
        totalProfessors: professors?.length || 0,
        totalCourses: courses?.length || 0
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
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral financeira da plataforma Learning Bridge
          </p>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movimentado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(financialData?.totalRevenue || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Valor bruto de todas as vendas
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita da Plataforma</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(financialData?.totalPlatformShare || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                10% do valor total das vendas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pago aos Professores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(financialData?.totalProfessorShare || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                85% do valor total das vendas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxas de Gateway</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(financialData?.totalGatewayShare || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                5% do valor total das vendas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Matrículas</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {financialData?.totalEnrollments || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {financialData?.totalProfessors || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos na Plataforma</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {financialData?.totalCourses || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Divisão de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-muted-foreground">Professores (85%)</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(financialData?.totalProfessorShare || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Plataforma (10%)</p>
                  <p className="text-2xl font-bold text-primary">
                    {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(financialData?.totalPlatformShare || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm text-muted-foreground">Gateway (5%)</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(financialData?.totalGatewayShare || 0)}
                  </p>
                </div>
              </div>

              <div className="h-4 rounded-full overflow-hidden bg-muted flex">
                <div className="bg-green-500 h-full" style={{ width: '85%' }} />
                <div className="bg-primary h-full" style={{ width: '10%' }} />
                <div className="bg-orange-500 h-full" style={{ width: '5%' }} />
              </div>

              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Professores (85%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Plataforma (10%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Gateway (5%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
