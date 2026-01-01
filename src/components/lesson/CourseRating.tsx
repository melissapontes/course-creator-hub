import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Rating {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
}

interface Props {
  courseId: string;
  isEnrolled: boolean;
}

export function CourseRating({ courseId, isEnrolled }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const { data: ratings = [], isLoading } = useQuery({
    queryKey: ['course-ratings', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Rating[];
    },
    enabled: !!courseId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['rating-profiles', ratings.map(r => r.user_id)],
    queryFn: async () => {
      const userIds = [...new Set(ratings.map(r => r.user_id))];
      if (!userIds.length) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      if (error) throw error;
      return data;
    },
    enabled: ratings.length > 0,
  });

  const userRating = ratings.find(r => r.user_id === user?.id);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (userRating) {
        const { error } = await supabase
          .from('course_ratings')
          .update({ rating, review: review || null })
          .eq('id', userRating.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('course_ratings').insert({
          course_id: courseId,
          user_id: user!.id,
          rating,
          review: review || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-ratings', courseId] });
      toast.success('Avaliação salva!');
      setShowForm(false);
    },
    onError: () => toast.error('Erro ao salvar avaliação'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!userRating) return;
      const { error } = await supabase.from('course_ratings').delete().eq('id', userRating.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-ratings', courseId] });
      toast.success('Avaliação removida!');
      setRating(5);
      setReview('');
    },
    onError: () => toast.error('Erro ao remover avaliação'),
  });

  const getProfileName = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.full_name || 'Usuário';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const averageRating = ratings.length 
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '0';

  const openEditForm = () => {
    if (userRating) {
      setRating(userRating.rating);
      setReview(userRating.review || '');
    }
    setShowForm(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Avaliações
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{averageRating}</span>
            <div className="text-sm text-muted-foreground">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-4 w-4',
                      star <= Math.round(parseFloat(averageRating))
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
              <span>{ratings.length} avaliação(ões)</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnrolled && (
          <div className="space-y-3">
            {!showForm ? (
              <div className="flex gap-2">
                <Button onClick={openEditForm}>
                  {userRating ? 'Editar minha avaliação' : 'Avaliar curso'}
                </Button>
                {userRating && (
                  <Button variant="outline" onClick={() => deleteMutation.mutate()}>
                    Remover avaliação
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Sua nota</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="p-1"
                      >
                        <Star
                          className={cn(
                            'h-8 w-8 transition-colors',
                            star <= (hoveredStar || rating)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Comentário (opcional)</label>
                  <Textarea
                    placeholder="O que você achou do curso?"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando avaliações...</p>
        ) : ratings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => {
              const userName = getProfileName(r.user_id);
              return (
                <div key={r.id} className="flex gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{userName}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-4 w-4',
                              star <= r.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-muted-foreground'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    {r.review && <p className="text-sm mt-1">{r.review}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
