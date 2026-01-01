import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, BookOpen } from 'lucide-react';

interface Material {
  id: string;
  lesson_id: string;
  type: 'DOWNLOAD' | 'LINK' | 'TEXT';
  title: string;
  content: string | null;
  file_url: string | null;
  order_index: number;
}

interface Props {
  lessonId: string;
}

export function LessonMaterials({ lessonId }: Props) {
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['lesson-materials', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');
      if (error) throw error;
      return data as Material[];
    },
    enabled: !!lessonId,
  });

  if (isLoading || materials.length === 0) {
    return null;
  }

  const downloads = materials.filter(m => m.type === 'DOWNLOAD');
  const links = materials.filter(m => m.type === 'LINK');
  const texts = materials.filter(m => m.type === 'TEXT');

  return (
    <div className="space-y-4">
      {downloads.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Downloads
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-2">
            {downloads.map((material) => (
              <Button
                key={material.id}
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={material.file_url || '#'} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  {material.title}
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {links.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Links Úteis
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-2">
            {links.map((material) => (
              <Button
                key={material.id}
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={material.content || '#'} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {material.title}
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {texts.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Material de Leitura
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-4">
            {texts.map((material) => (
              <div key={material.id}>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {material.title}
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                  {material.content}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
