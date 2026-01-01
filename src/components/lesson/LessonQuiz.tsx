import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { HelpCircle, CheckCircle, XCircle, Trophy, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  passing_score: number;
}

interface Question {
  id: string;
  quiz_id: string;
  question: string;
  order_index: number;
}

interface Option {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  completed_at: string;
}

interface Props {
  lessonId: string;
}

export function LessonQuiz({ lessonId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { data: quiz } = useQuery({
    queryKey: ['lesson-quiz', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();
      if (error) throw error;
      return data as Quiz | null;
    },
    enabled: !!lessonId,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['quiz-questions', quiz?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz!.id)
        .order('order_index');
      if (error) throw error;
      return data as Question[];
    },
    enabled: !!quiz?.id,
  });

  const { data: options = [] } = useQuery({
    queryKey: ['quiz-options', quiz?.id],
    queryFn: async () => {
      if (!questions.length) return [];
      const questionIds = questions.map(q => q.id);
      const { data, error } = await supabase
        .from('quiz_options')
        .select('*')
        .in('question_id', questionIds)
        .order('order_index');
      if (error) throw error;
      return data as Option[];
    },
    enabled: !!questions.length,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['quiz-attempts', quiz?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quiz!.id)
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data as QuizAttempt[];
    },
    enabled: !!quiz?.id && !!user?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      let correct = 0;
      questions.forEach((q) => {
        const selectedOption = answers[q.id];
        const correctOption = options.find(o => o.question_id === q.id && o.is_correct);
        if (selectedOption === correctOption?.id) {
          correct++;
        }
      });

      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= (quiz?.passing_score || 70);

      const { error } = await supabase.from('quiz_attempts').insert({
        quiz_id: quiz!.id,
        user_id: user!.id,
        score,
        passed,
        answers,
      });
      if (error) throw error;
      return { score, passed };
    },
    onSuccess: ({ score, passed }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', quiz?.id] });
      setShowResults(true);
      if (passed) {
        toast.success(`Parabéns! Você passou com ${score}%!`);
      } else {
        toast.error(`Você fez ${score}%. Tente novamente!`);
      }
    },
    onError: () => toast.error('Erro ao enviar quiz'),
  });

  const resetQuiz = () => {
    setAnswers({});
    setShowResults(false);
    setCurrentQuestionIndex(0);
  };

  if (!quiz || questions.length === 0) {
    return null;
  }

  const getOptionsForQuestion = (questionId: string) => options.filter(o => o.question_id === questionId);
  const lastAttempt = attempts[0];
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
  const allAnswered = questions.every(q => answers[q.id]);

  // Calculate results
  const calculateResults = () => {
    let correct = 0;
    const results: Record<string, { correct: boolean; correctOptionId: string }> = {};
    
    questions.forEach((q) => {
      const selectedOption = answers[q.id];
      const correctOption = options.find(o => o.question_id === q.id && o.is_correct);
      const isCorrect = selectedOption === correctOption?.id;
      if (isCorrect) correct++;
      results[q.id] = { correct: isCorrect, correctOptionId: correctOption?.id || '' };
    });

    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100), results };
  };

  if (showResults) {
    const { correct, total, percentage, results } = calculateResults();
    const passed = percentage >= quiz.passing_score;

    return (
      <Card>
        <CardHeader className="text-center">
          <div className={cn(
            'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4',
            passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
          )}>
            {passed ? (
              <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            )}
          </div>
          <CardTitle className={passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {passed ? 'Parabéns!' : 'Tente novamente'}
          </CardTitle>
          <CardDescription>
            Você acertou {correct} de {total} ({percentage}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, idx) => {
            const result = results[q.id];
            const questionOptions = getOptionsForQuestion(q.id);
            return (
              <div key={q.id} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-start gap-2">
                  {result.correct ? (
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{idx + 1}. {q.question}</p>
                    <div className="mt-2 space-y-1">
                      {questionOptions.map((opt) => (
                        <div
                          key={opt.id}
                          className={cn(
                            'text-xs px-2 py-1 rounded',
                            opt.id === answers[q.id] && !opt.is_correct && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
                            opt.is_correct && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          )}
                        >
                          {opt.option_text}
                          {opt.is_correct && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Button onClick={resetQuiz} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              {quiz.title}
            </CardTitle>
            {quiz.description && <CardDescription>{quiz.description}</CardDescription>}
          </div>
          {lastAttempt && (
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              lastAttempt.passed 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
            )}>
              Melhor: {lastAttempt.score}%
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-4">{currentQuestionIndex + 1}. {currentQuestion.question}</h4>
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
          >
            {getOptionsForQuestion(currentQuestion.id).map((opt) => (
              <div key={opt.id} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.id} id={opt.id} />
                <Label htmlFor={opt.id} className="cursor-pointer flex-1 py-2">
                  {opt.option_text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Anterior
          </Button>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={!answers[currentQuestion.id]}
            >
              Próxima
            </Button>
          ) : (
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!allAnswered || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Enviar Quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
