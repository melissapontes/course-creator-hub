import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, ArrowLeft, Trash2, Loader2, BookOpen, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { createGetCourseCommentsUseCase, createDeleteCommentUseCase } from '@/features/teacher/di';
import { CourseComment } from '@/features/teacher/domain/entities';

export default function CourseCommentsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['course-comments', id],
    queryFn: async () => {
      const useCase = createGetCourseCommentsUseCase();
      return useCase.execute(id!);
    },
    enabled: !!id,
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const useCase = createDeleteCommentUseCase();
      return useCase.execute(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-comments', id] });
      toast.success('Comentário removido');
    },
    onError: () => {
      toast.error('Erro ao remover comentário');
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  // Group comments by lesson
  const commentsByLesson = comments?.reduce((acc, comment) => {
    const key = `${comment.sectionTitle} > ${comment.lessonTitle}`;
    if (!acc[key]) {
      acc[key] = { lessonId: comment.lessonId, comments: [] };
    }
    acc[key].comments.push(comment);
    return acc;
  }, {} as Record<string, { lessonId: string; comments: CourseComment[] }>) || {};

  const renderComment = (comment: CourseComment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : ''}`}>
      <Avatar className={isReply ? 'w-8 h-8' : 'w-10 h-10'}>
        <AvatarImage src={comment.userAvatar || undefined} />
        <AvatarFallback className={isReply ? 'text-xs' : ''}>
          {getInitials(comment.userName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className={`bg-muted/50 rounded-lg ${isReply ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className={`font-medium text-foreground ${isReply ? 'text-sm' : ''}`}>
                {comment.userName}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => deleteComment.mutate(comment.id)}
              disabled={deleteComment.isPending}
            >
              {deleteComment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className={`text-foreground whitespace-pre-wrap ${isReply ? 'text-sm' : ''}`}>
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );

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

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Comentários do Curso</h1>
            <p className="text-muted-foreground mt-1">
              {comments?.length || 0} comentários de alunos
            </p>
          </div>
          <Link to={`/learn/${id}`}>
            <Button variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Ver como Aluno
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Object.keys(commentsByLesson).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum comentário ainda
              </h3>
              <p className="text-muted-foreground">
                Os comentários dos alunos aparecerão aqui conforme eles interagem com as aulas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(commentsByLesson).map(([lessonPath, { lessonId, comments: lessonComments }]) => (
              <Card key={lessonId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      {lessonPath}
                    </CardTitle>
                    <Badge variant="secondary">
                      {lessonComments.length} comentário{lessonComments.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lessonComments.map(comment => (
                    <div key={comment.id}>
                      {renderComment(comment)}
                      {comment.replies?.map(reply => renderComment(reply, true))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
