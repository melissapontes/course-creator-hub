import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit, Loader2, HelpCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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

interface Props {
  lessonId: string;
}

export function QuizEditor({ lessonId }: Props) {
  const queryClient = useQueryClient();
  const [quizDialog, setQuizDialog] = useState(false);
  const [questionDialog, setQuestionDialog] = useState<{ open: boolean; quizId: string | null }>({ open: false, quizId: null });
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);

  const [quizForm, setQuizForm] = useState({ title: '', description: '', passing_score: 70 });
  const [questionForm, setQuestionForm] = useState({ question: '', options: [
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]});

  // Fetch quiz
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

  // Fetch questions
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

  // Fetch options
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

  const saveQuizMutation = useMutation({
    mutationFn: async () => {
      if (editQuiz || quiz) {
        const { error } = await supabase
          .from('quizzes')
          .update(quizForm)
          .eq('id', (editQuiz || quiz)!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert({ ...quizForm, lesson_id: lessonId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-quiz', lessonId] });
      toast.success('Quiz salvo!');
      closeQuizDialog();
    },
    onError: () => toast.error('Erro ao salvar quiz'),
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-quiz', lessonId] });
      toast.success('Quiz excluído!');
      setDeleteQuizId(null);
    },
    onError: () => toast.error('Erro ao excluir quiz'),
  });

  const saveQuestionMutation = useMutation({
    mutationFn: async () => {
      let questionId = editQuestion?.id;

      if (editQuestion) {
        const { error } = await supabase
          .from('quiz_questions')
          .update({ question: questionForm.question })
          .eq('id', editQuestion.id);
        if (error) throw error;

        // Delete old options
        await supabase.from('quiz_options').delete().eq('question_id', editQuestion.id);
      } else {
        const maxOrder = questions.length ? Math.max(...questions.map(q => q.order_index)) : -1;
        const { data, error } = await supabase
          .from('quiz_questions')
          .insert({ quiz_id: questionDialog.quizId!, question: questionForm.question, order_index: maxOrder + 1 })
          .select()
          .single();
        if (error) throw error;
        questionId = data.id;
      }

      // Insert options
      const validOptions = questionForm.options.filter(o => o.text.trim());
      if (validOptions.length >= 2) {
        const { error } = await supabase.from('quiz_options').insert(
          validOptions.map((o, i) => ({
            question_id: questionId!,
            option_text: o.text,
            is_correct: o.is_correct,
            order_index: i,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', quiz?.id] });
      queryClient.invalidateQueries({ queryKey: ['quiz-options', quiz?.id] });
      toast.success(editQuestion ? 'Pergunta atualizada!' : 'Pergunta adicionada!');
      closeQuestionDialog();
    },
    onError: () => toast.error('Erro ao salvar pergunta'),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', quiz?.id] });
      toast.success('Pergunta excluída!');
      setDeleteQuestionId(null);
    },
    onError: () => toast.error('Erro ao excluir pergunta'),
  });

  const openQuizDialog = () => {
    if (quiz) {
      setEditQuiz(quiz);
      setQuizForm({ title: quiz.title, description: quiz.description || '', passing_score: quiz.passing_score });
    } else {
      setEditQuiz(null);
      setQuizForm({ title: '', description: '', passing_score: 70 });
    }
    setQuizDialog(true);
  };

  const closeQuizDialog = () => {
    setQuizDialog(false);
    setEditQuiz(null);
    setQuizForm({ title: '', description: '', passing_score: 70 });
  };

  const openQuestionDialog = (quizId: string, question?: Question) => {
    if (question) {
      setEditQuestion(question);
      const questionOptions = options.filter(o => o.question_id === question.id);
      setQuestionForm({
        question: question.question,
        options: [
          { text: questionOptions[0]?.option_text || '', is_correct: questionOptions[0]?.is_correct || false },
          { text: questionOptions[1]?.option_text || '', is_correct: questionOptions[1]?.is_correct || false },
          { text: questionOptions[2]?.option_text || '', is_correct: questionOptions[2]?.is_correct || false },
          { text: questionOptions[3]?.option_text || '', is_correct: questionOptions[3]?.is_correct || false },
        ],
      });
    } else {
      setEditQuestion(null);
      setQuestionForm({ question: '', options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ]});
    }
    setQuestionDialog({ open: true, quizId });
  };

  const closeQuestionDialog = () => {
    setQuestionDialog({ open: false, quizId: null });
    setEditQuestion(null);
  };

  const getOptionsForQuestion = (questionId: string) => options.filter(o => o.question_id === questionId);

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Quiz / Teste</CardTitle>
          {!quiz ? (
            <Button size="sm" variant="outline" onClick={openQuizDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Criar Quiz
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={openQuizDialog}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteQuizId(quiz.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-2">
        {!quiz ? (
          <p className="text-sm text-muted-foreground">Nenhum quiz nesta aula</p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm">{quiz.title}</p>
              {quiz.description && <p className="text-xs text-muted-foreground">{quiz.description}</p>}
              <p className="text-xs text-muted-foreground">Nota mínima: {quiz.passing_score}%</p>
            </div>

            <div className="space-y-2">
              {questions.map((question, idx) => (
                <div key={question.id} className="p-2 rounded-lg bg-muted/50 text-sm">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{idx + 1}. {question.question}</p>
                      <div className="mt-1 space-y-1">
                        {getOptionsForQuestion(question.id).map((opt) => (
                          <div key={opt.id} className="flex items-center gap-1 text-xs">
                            {opt.is_correct ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <span className="w-3 h-3" />
                            )}
                            <span className={opt.is_correct ? 'text-green-600' : 'text-muted-foreground'}>
                              {opt.option_text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openQuestionDialog(quiz.id, question)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteQuestionId(question.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button size="sm" variant="outline" className="w-full" onClick={() => openQuestionDialog(quiz.id)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Pergunta
            </Button>
          </div>
        )}
      </CardContent>

      {/* Quiz Dialog */}
      <Dialog open={quizDialog} onOpenChange={(open) => !open && closeQuizDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editQuiz || quiz ? 'Editar Quiz' : 'Criar Quiz'}</DialogTitle>
            <DialogDescription>Configure o teste para esta aula</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Teste seus conhecimentos"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Instruções para o quiz..."
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Nota mínima para aprovação (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={quizForm.passing_score}
                onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeQuizDialog}>Cancelar</Button>
            <Button
              onClick={() => saveQuizMutation.mutate()}
              disabled={!quizForm.title.trim() || saveQuizMutation.isPending}
            >
              {saveQuizMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialog.open} onOpenChange={(open) => !open && closeQuestionDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
            <DialogDescription>Adicione a pergunta e as opções de resposta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Textarea
                placeholder="Digite a pergunta..."
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Opções (marque a correta)</Label>
              {questionForm.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Checkbox
                    checked={opt.is_correct}
                    onCheckedChange={(checked) => {
                      const newOptions = [...questionForm.options];
                      newOptions[idx].is_correct = !!checked;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                  />
                  <Input
                    placeholder={`Opção ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[idx].text = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeQuestionDialog}>Cancelar</Button>
            <Button
              onClick={() => saveQuestionMutation.mutate()}
              disabled={!questionForm.question.trim() || questionForm.options.filter(o => o.text.trim()).length < 2 || saveQuestionMutation.isPending}
            >
              {saveQuestionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Quiz Dialog */}
      <AlertDialog open={!!deleteQuizId} onOpenChange={(open) => !open && setDeleteQuizId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir quiz?</AlertDialogTitle>
            <AlertDialogDescription>Isso excluirá todas as perguntas e respostas. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteQuizId && deleteQuizMutation.mutate(deleteQuizId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Dialog */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={(open) => !open && setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteQuestionId && deleteQuestionMutation.mutate(deleteQuestionId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
