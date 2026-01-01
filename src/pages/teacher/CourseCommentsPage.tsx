import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, MessageCircle, Search, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  lesson_id: string;
  lesson_title: string;
  section_title: string;
  user_name: string | null;
}

export default function CourseCommentsPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const { authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch course
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-comments', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch all comments for this course
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['course-all-comments', courseId],
    queryFn: async () => {
      // Get all sections for this course
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('id, title')
        .eq('course_id', courseId!);

      if (sectionsError) throw sectionsError;
      if (!sections?.length) return [];

      const sectionIds = sections.map(s => s.id);
      const sectionMap = Object.fromEntries(sections.map(s => [s.id, s.title]));

      // Get all lessons for these sections
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, section_id')
        .in('section_id', sectionIds);

      if (lessonsError) throw lessonsError;
      if (!lessons?.length) return [];

      const lessonIds = lessons.map(l => l.id);
      const lessonMap = Object.fromEntries(
        lessons.map(l => [l.id, { title: l.title, section_id: l.section_id }])
      );

      // Get all comments for these lessons
      const { data: commentsData, error: commentsError } = await supabase
        .from('lesson_comments')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      if (!commentsData?.length) return [];

      // Get user profiles
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map(p => [p.user_id, p.full_name])
      );

      // Map comments with all info
      return commentsData.map(comment => ({
        ...comment,
        lesson_title: lessonMap[comment.lesson_id]?.title || 'Aula desconhecida',
        section_title: sectionMap[lessonMap[comment.lesson_id]?.section_id] || 'Seção desconhecida',
        user_name: profileMap[comment.user_id] || null,
      })) as Comment[];
    },
    enabled: !!courseId,
  });

  // Filter comments by search
  const filteredComments = comments?.filter(comment => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      comment.content.toLowerCase().includes(query) ||
      comment.lesson_title.toLowerCase().includes(query) ||
      comment.section_title.toLowerCase().includes(query) ||
      (comment.user_name?.toLowerCase().includes(query) ?? false)
    );
  });

  if (courseLoading || commentsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course || course.instructor_id !== authUser?.id) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 text-center">
          <p className="text-muted-foreground">Curso não encontrado ou você não tem permissão.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/teacher/courses/${courseId}/edit`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Curso
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Comentários dos Alunos
              </h1>
              <p className="text-muted-foreground mt-1">{course.title}</p>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">{comments?.length || 0} comentários</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar comentários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Comments List */}
        <ScrollArea className="h-[calc(100vh-350px)]">
          <div className="space-y-4">
            {filteredComments && filteredComments.length > 0 ? (
              filteredComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {comment.user_name || 'Usuário'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium">{comment.section_title}</span>
                          {' › '}
                          <span>{comment.lesson_title}</span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchQuery ? 'Nenhum comentário encontrado' : 'Nenhum comentário ainda'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? 'Tente buscar com outros termos'
                      : 'Os comentários dos alunos aparecerão aqui'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </DashboardLayout>
  );
}
