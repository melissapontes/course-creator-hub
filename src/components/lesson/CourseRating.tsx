import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  isEnrolled: boolean;
}

interface CourseRating {
  id: string;
  rating: number;
  comment: string | null;
  user_id: string;
  created_at: string;
}

export function CourseRating({ courseId, isEnrolled }: Props) {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch all ratings for this course
  const { data: ratings = [] } = useQuery({
    queryKey: ['course-ratings', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CourseRating[];
    },
  });

  // Fetch user's rating
  const { data: userRating } = useQuery({
    queryKey: ['user-course-rating', courseId, authUser?.id],
    queryFn: async () => {
      if (!authUser) return null;
      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) throw error;
      return data as CourseRating | null;
    },
    enabled: !!authUser && isEnrolled,
  });

  // Calculate average rating
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  // Submit rating mutation
  const submitRating = useMutation({
    mutationFn: async () => {
      if (!authUser) throw new Error('Usuário não autenticado');

      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from('course_ratings')
          .update({ rating: selectedRating, comment: comment || null })
          .eq('id', userRating.id);
        if (error) throw error;
      } else {
        // Create new rating
        const { error } = await supabase
          .from('course_ratings')
          .insert({
            course_id: courseId,
            user_id: authUser.id,
            rating: selectedRating,
            comment: comment || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-ratings', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId] });
      toast.success(userRating ? 'Avaliação atualizada!' : 'Avaliação enviada!');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Erro ao enviar avaliação');
    },
  });

  // Start editing with current values
  const startEditing = () => {
    if (userRating) {
      setSelectedRating(userRating.rating);
      setComment(userRating.comment || '');
    }
    setIsEditing(true);
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 transition-colors ${
              star <= (interactive ? (hoverRating || selectedRating) : rating)
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && setSelectedRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Avaliações
          </div>
          <div className="flex items-center gap-2 text-sm font-normal">
            {averageRating > 0 ? (
              <>
                <span className="font-bold">{averageRating.toFixed(1)}</span>
                {renderStars(Math.round(averageRating))}
                <span className="text-muted-foreground">({ratings.length})</span>
              </>
            ) : (
              <span className="text-muted-foreground">Sem avaliações</span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User rating form - only for enrolled users */}
        {isEnrolled && authUser && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            {!isEditing && userRating ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sua avaliação</span>
                  <Button variant="ghost" size="sm" onClick={startEditing}>
                    Editar
                  </Button>
                </div>
                {renderStars(userRating.rating)}
                {userRating.comment && (
                  <p className="text-sm text-muted-foreground">{userRating.comment}</p>
                )}
              </div>
            ) : isEditing || !userRating ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {userRating ? 'Editar avaliação' : 'Avaliar este curso'}
                  </label>
                  {renderStars(0, true)}
                </div>
                <Textarea
                  placeholder="Deixe um comentário (opcional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => submitRating.mutate()}
                    disabled={selectedRating === 0 || submitRating.isPending}
                  >
                    {submitRating.isPending ? 'Enviando...' : 'Enviar'}
                  </Button>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Recent ratings */}
        {ratings.length > 0 ? (
          <div className="space-y-3">
            {ratings.slice(0, 5).map((rating) => (
              <div key={rating.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  {renderStars(rating.rating)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(rating.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {rating.comment && (
                  <p className="text-sm text-muted-foreground">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma avaliação ainda. {isEnrolled && 'Seja o primeiro a avaliar!'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}