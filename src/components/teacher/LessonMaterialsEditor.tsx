import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface Props {
  lessonId: string;
  courseId: string;
}

export function LessonMaterialsEditor({ lessonId, courseId }: Props) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Materiais da Aula
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <p className="text-sm text-muted-foreground">
          Sistema de materiais em breve...
        </p>
      </CardContent>
    </Card>
  );
}
