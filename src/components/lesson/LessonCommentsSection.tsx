import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Trash2, Reply, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface LessonCommentsSectionProps {
  lessonId: string;
}

export function LessonCommentsSection({ lessonId }: LessonCommentsSectionProps) {
  const { authUser, user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_comments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles for comments
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Organize comments into threads
      const commentsWithUsers = data.map(c => ({
        ...c,
        user: profileMap.get(c.user_id) || { full_name: 'Usuário', avatar_url: null },
      }));

      // Separate root comments and replies
      const rootComments = commentsWithUsers.filter(c => !c.parent_id);
      const replies = commentsWithUsers.filter(c => c.parent_id);

      // Attach replies to their parent comments
      return rootComments.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parent_id === comment.id),
      })) as Comment[];
    },
    enabled: !!lessonId,
  });

  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const { error } = await supabase.from('lesson_comments').insert({
        lesson_id: lessonId,
        user_id: user!.id,
        content,
        parent_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
      setNewComment('');
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Comentário adicionado!');
    },
    onError: () => {
      toast.error('Erro ao adicionar comentário');
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('lesson_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
      toast.success('Comentário removido');
    },
    onError: () => {
      toast.error('Erro ao remover comentário');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment.mutate({ content: newComment.trim() });
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    addComment.mutate({ content: replyContent.trim(), parentId });
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Comentários ({comments?.length || 0})</h3>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!newComment.trim() || addComment.isPending}>
            {addComment.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar
          </Button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Carregando comentários...
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id} className="space-y-4">
              {/* Main Comment */}
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={comment.user?.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(comment.user?.full_name || 'U')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-foreground">
                          {comment.user?.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      {comment.user_id === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteComment.mutate(comment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-muted-foreground"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Responder
                  </Button>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 ml-4 space-y-2">
                      <Textarea
                        placeholder="Escreva sua resposta..."
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReply(comment.id)}
                          disabled={!replyContent.trim() || addComment.isPending}
                        >
                          Responder
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-4 space-y-3 border-l-2 border-border pl-4">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={reply.user?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(reply.user?.full_name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted/30 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <span className="font-medium text-sm text-foreground">
                                    {reply.user?.full_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatDate(reply.created_at)}
                                  </span>
                                </div>
                                {reply.user_id === user?.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => deleteComment.mutate(reply.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </p>
      )}
    </div>
  );
}
