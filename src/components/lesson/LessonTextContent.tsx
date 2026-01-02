import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface Props {
  content: string;
  title: string;
}

export function LessonTextContent({ content, title }: Props) {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="bg-muted/30 rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <FileText className="h-5 w-5" />
            <span className="text-sm">Conteúdo de Texto</span>
          </div>
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {content || 'Nenhum conteúdo disponível.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
