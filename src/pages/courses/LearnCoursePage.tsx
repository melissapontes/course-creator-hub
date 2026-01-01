import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

export default function LearnCoursePage() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 text-center">
        <Card>
          <CardContent className="p-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Player de Aulas</h1>
            <p className="text-muted-foreground mb-6">
              O sistema de reprodução de aulas estará disponível em breve.
            </p>
            <Link to="/courses">
              <Button>Ver Cursos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
