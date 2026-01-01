import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

interface Props {
  lessonId: string;
}

export function QuizEditor({ lessonId }: Props) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Quiz / Teste
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <p className="text-sm text-muted-foreground">
          Sistema de quiz em breve...
        </p>
      </CardContent>
    </Card>
  );
}
