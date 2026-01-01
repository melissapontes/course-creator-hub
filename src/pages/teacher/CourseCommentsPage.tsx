import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowLeft } from 'lucide-react';

export default function CourseCommentsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <Link to={`/teacher/courses/${id}/edit`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Comentários do Curso</h1>
          <p className="text-muted-foreground mt-1">Gerencie os comentários dos alunos</p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Sistema de Comentários
            </h3>
            <p className="text-muted-foreground">
              Em breve você poderá gerenciar os comentários dos alunos aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
