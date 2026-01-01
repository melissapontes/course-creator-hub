import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageCircle, Trash2, CornerDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comment {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
}

interface Props {
  lessonId: string;
}

export function LessonComments({ lessonId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_comments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!lessonId,
  });

  // Fetch user profiles for comments
  const { data: profiles = [] } = useQuery({
    queryKey: ['comment-profiles', comments.map(c => c.user_id)],
    queryFn: async () => {
      const userIds = [...new Set(comments.map(c => c.user_id))];
      if (!userIds.length) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      if (error) throw error;
      return data;
    },
    enabled: comments.length > 0,
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('lesson_comments').insert({
        lesson_id: lessonId,
        user_id: user!.id,
        content: newComment,
        parent_id: replyTo?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
      toast.success('Comentário adicionado!');
      setNewComment('');
      setReplyTo(null);
    },
    onError: () => toast.error('Erro ao adicionar comentário'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lesson_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
      toast.success('Comentário excluído!');
    },
    onError: () => toast.error('Erro ao excluir comentário'),
  });

  const getProfileName = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.full_name || 'Usuário';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (commentId: string) => comments.filter(c => c.parent_id === commentId);

  const renderComment = (comment: Comment, isReply = false) => {
    const userName = getProfileName(comment.user_id);
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={isReply ? 'ml-8 mt-3' : ''}>
        <div className="flex gap-3">
          {isReply && <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{userName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-2 mt-2">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setReplyTo({ id: comment.id, content: comment.content })}
                >
                  Responder
                </Button>
              )}
              {comment.user_id === user?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Comentários ({comments.length})</h3>
      </div>

      {/* Add Comment */}
      <div className="space-y-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <CornerDownRight className="h-4 w-4" />
            <span>Respondendo a: "{replyTo.content.slice(0, 50)}..."</span>
            <Button variant="ghost" size="sm" className="h-6" onClick={() => setReplyTo(null)}>
              Cancelar
            </Button>
          </div>
        )}
        <Textarea
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
        />
        <Button
          size="sm"
          onClick={() => addCommentMutation.mutate()}
          disabled={!newComment.trim() || addCommentMutation.isPending}
        >
          {addCommentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : null}
          Comentar
        </Button>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando comentários...</p>
      ) : topLevelComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
