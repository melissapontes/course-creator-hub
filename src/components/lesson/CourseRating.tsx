import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface Props {
  courseId: string;
  isEnrolled: boolean;
}

export function CourseRating({ courseId, isEnrolled }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Avaliações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Sistema de avaliações em breve...
        </p>
      </CardContent>
    </Card>
  );
}
