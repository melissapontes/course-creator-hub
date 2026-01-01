import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Play } from 'lucide-react';

export default function StudentDashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Meu Painel</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo à sua área de estudante</p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Explore nossos cursos
            </h3>
            <p className="text-muted-foreground mb-6">
              Sistema de matrículas em breve. Por enquanto, explore o catálogo de cursos disponíveis.
            </p>
            <Link to="/courses">
              <Button>
                <Play className="w-4 h-4 mr-2" />
                Ver Cursos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
