import { MessageCircle } from 'lucide-react';

interface Props {
  lessonId: string;
}

export function LessonComments({ lessonId }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Comentários</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Sistema de comentários em breve...
      </p>
    </div>
  );
}
