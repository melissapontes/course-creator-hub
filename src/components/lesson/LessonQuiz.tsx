import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { HelpCircle, CheckCircle, XCircle, RefreshCw, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  lesson_id: string;
  question: string;
  question_order: number;
}

interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

interface QuizAttempt {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  completed_at: string;
}

interface Props {
  lessonId: string;
}

export function LessonQuiz({ lessonId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['student-quiz-questions', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('question_order');
      if (error) throw error;
      return data as QuizQuestion[];
    },
  });

  // Fetch options
  const { data: allOptions } = useQuery({
    queryKey: ['student-quiz-options', lessonId],
    queryFn: async () => {
      if (!questions?.length) return [];
      const questionIds = questions.map(q => q.id);
      const { data, error } = await supabase
        .from('quiz_options')
        .select('*')
        .in('question_id', questionIds)
        .order('option_order');
      if (error) throw error;
      return data as QuizOption[];
    },
    enabled: !!questions?.length,
  });

  // Fetch previous attempt
  const { data: previousAttempt } = useQuery({
    queryKey: ['quiz-attempt', lessonId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as QuizAttempt | null;
    },
    enabled: !!user?.id,
  });

  // Save attempt
  const saveAttempt = useMutation({
    mutationFn: async ({ score, total, passed }: { score: number; total: number; passed: boolean }) => {
      const { error } = await supabase
        .from('quiz_attempts')
        .upsert({
          user_id: user!.id,
          lesson_id: lessonId,
          score,
          total_questions: total,
          passed,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempt', lessonId, user?.id] });
    },
  });

  if (questionsLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!questions || questions.length === 0) {
    return null;
  }

  const getOptionsForQuestion = (questionId: string) => {
    return allOptions?.filter(o => o.question_id === questionId) || [];
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentOptions = currentQuestion ? getOptionsForQuestion(currentQuestion.id) : [];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const selectedOptionId = selectedAnswers[q.id];
      const correctOption = getOptionsForQuestion(q.id).find(o => o.is_correct);
      if (selectedOptionId === correctOption?.id) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmit = () => {
    const score = calculateScore();
    const passed = score >= Math.ceil(totalQuestions * 0.7); // 70% to pass
    saveAttempt.mutate({ score, total: totalQuestions, passed });
    setShowResults(true);
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuizStarted(true);
  };

  // Show previous result if exists and quiz not started
  if (previousAttempt && !quizStarted) {
    const percentage = Math.round((previousAttempt.score / previousAttempt.total_questions) * 100);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz da Aula
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            {previousAttempt.passed ? (
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            )}
            <h3 className="text-lg font-semibold mb-1">
              {previousAttempt.passed ? 'Quiz Concluído!' : 'Quiz Não Aprovado'}
            </h3>
            <p className="text-muted-foreground mb-3">
              Você acertou {previousAttempt.score} de {previousAttempt.total_questions} perguntas ({percentage}%)
            </p>
            <Progress value={percentage} className="h-2 mb-4" />
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show results
  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = score >= Math.ceil(totalQuestions * 0.7);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Resultado do Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            {passed ? (
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            )}
            <h3 className="text-lg font-semibold mb-1">
              {passed ? 'Parabéns!' : 'Tente Novamente'}
            </h3>
            <p className="text-muted-foreground mb-3">
              Você acertou {score} de {totalQuestions} perguntas ({percentage}%)
            </p>
            <Progress value={percentage} className="h-2 mb-4" />
          </div>

          {/* Show all questions with answers */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const options = getOptionsForQuestion(q.id);
              const selectedId = selectedAnswers[q.id];
              const correctOption = options.find(o => o.is_correct);
              const isCorrect = selectedId === correctOption?.id;

              return (
                <div key={q.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                    )}
                    <p className="font-medium">{idx + 1}. {q.question}</p>
                  </div>
                  <div className="pl-7 space-y-1">
                    {options.map(opt => (
                      <div
                        key={opt.id}
                        className={cn(
                          'text-sm px-2 py-1 rounded',
                          opt.is_correct && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                          !opt.is_correct && selectedId === opt.id && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        )}
                      >
                        {opt.is_correct ? '✓ ' : selectedId === opt.id ? '✗ ' : '○ '}
                        {opt.option_text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={handleRetry} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show start screen
  if (!quizStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz da Aula
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <HelpCircle className="h-12 w-12 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Teste seus conhecimentos!</h3>
          <p className="text-muted-foreground mb-4">
            Este quiz tem {totalQuestions} pergunta{totalQuestions > 1 ? 's' : ''}. 
            Você precisa acertar pelo menos 70% para ser aprovado.
          </p>
          <Button onClick={() => setQuizStarted(true)}>
            Iniciar Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show quiz question
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-5 w-5" />
            Pergunta {currentQuestionIndex + 1} de {totalQuestions}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-medium text-lg">{currentQuestion?.question}</p>

        <RadioGroup
          value={selectedAnswers[currentQuestion?.id || ''] || ''}
          onValueChange={(value) => {
            if (currentQuestion) {
              setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
            }
          }}
          className="space-y-2"
        >
          {currentOptions.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => {
                if (currentQuestion) {
                  setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: opt.id }));
                }
              }}
            >
              <RadioGroupItem value={opt.id} id={opt.id} />
              <Label htmlFor={opt.id} className="flex-1 cursor-pointer">
                {opt.option_text}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
          >
            Anterior
          </Button>
          
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={!selectedAnswers[currentQuestion?.id || '']}
            >
              Próxima
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(selectedAnswers).length < totalQuestions || saveAttempt.isPending}
            >
              {saveAttempt.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finalizar Quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
