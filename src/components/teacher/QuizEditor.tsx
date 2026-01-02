import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

interface Props {
  lessonId: string;
}

export function QuizEditor({ lessonId }: Props) {
  const queryClient = useQueryClient();
  const [newQuestion, setNewQuestion] = useState('');
  const [editingOptions, setEditingOptions] = useState<Record<string, { text: string; isCorrect: boolean }[]>>({});

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['quiz-questions', lessonId],
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

  // Fetch options for all questions
  const { data: allOptions } = useQuery({
    queryKey: ['quiz-options', lessonId],
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

  // Add question
  const addQuestion = useMutation({
    mutationFn: async (question: string) => {
      const maxOrder = questions?.length ? Math.max(...questions.map(q => q.question_order)) : -1;
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert({
          lesson_id: lessonId,
          question,
          question_order: maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', lessonId] });
      toast.success('Pergunta adicionada!');
      setNewQuestion('');
      // Initialize with 4 empty options
      setEditingOptions(prev => ({
        ...prev,
        [data.id]: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      }));
    },
    onError: () => toast.error('Erro ao adicionar pergunta'),
  });

  // Delete question
  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-options', lessonId] });
      toast.success('Pergunta excluída!');
    },
    onError: () => toast.error('Erro ao excluir pergunta'),
  });

  // Save options for a question
  const saveOptions = useMutation({
    mutationFn: async ({ questionId, options }: { questionId: string; options: { text: string; isCorrect: boolean }[] }) => {
      // Delete existing options
      await supabase.from('quiz_options').delete().eq('question_id', questionId);
      
      // Insert new options
      const validOptions = options.filter(o => o.text.trim());
      if (validOptions.length > 0) {
        const { error } = await supabase.from('quiz_options').insert(
          validOptions.map((opt, idx) => ({
            question_id: questionId,
            option_text: opt.text,
            is_correct: opt.isCorrect,
            option_order: idx,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-options', lessonId] });
      toast.success('Opções salvas!');
    },
    onError: () => toast.error('Erro ao salvar opções'),
  });

  const getOptionsForQuestion = (questionId: string) => {
    return allOptions?.filter(o => o.question_id === questionId) || [];
  };

  const initializeEditingOptions = (questionId: string) => {
    const existing = getOptionsForQuestion(questionId);
    if (existing.length > 0) {
      setEditingOptions(prev => ({
        ...prev,
        [questionId]: existing.map(o => ({ text: o.option_text, isCorrect: o.is_correct })),
      }));
    } else {
      setEditingOptions(prev => ({
        ...prev,
        [questionId]: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      }));
    }
  };

  const updateOptionText = (questionId: string, index: number, value: string) => {
    setEditingOptions(prev => {
      const opts = [...(prev[questionId] || [])];
      opts[index] = { ...opts[index], text: value };
      return { ...prev, [questionId]: opts };
    });
  };

  const updateOptionCorrect = (questionId: string, index: number, value: boolean) => {
    setEditingOptions(prev => {
      const opts = [...(prev[questionId] || [])];
      // If setting this as correct, unset others
      opts.forEach((o, i) => {
        o.isCorrect = i === index && value === true;
      });
      return { ...prev, [questionId]: opts };
    });
  };

  const addOption = (questionId: string) => {
    setEditingOptions(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), { text: '', isCorrect: false }],
    }));
  };

  const removeOption = (questionId: string, index: number) => {
    setEditingOptions(prev => ({
      ...prev,
      [questionId]: (prev[questionId] || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Quiz / Teste
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questionsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Questions list */}
            {questions && questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((q, qIndex) => (
                  <div key={q.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 cursor-grab" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {qIndex + 1}. {q.question}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteQuestion.mutate(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Options */}
                    {editingOptions[q.id] ? (
                      <div className="pl-7 space-y-2">
                        {editingOptions[q.id].map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <Checkbox
                              checked={opt.isCorrect}
                              onCheckedChange={(checked) => updateOptionCorrect(q.id, optIndex, !!checked)}
                            />
                            <Input
                              value={opt.text}
                              onChange={(e) => updateOptionText(q.id, optIndex, e.target.value)}
                              placeholder={`Opção ${optIndex + 1}`}
                              className="flex-1 h-8 text-sm"
                            />
                            {editingOptions[q.id].length > 2 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeOption(q.id, optIndex)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(q.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Opção
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveOptions.mutate({ questionId: q.id, options: editingOptions[q.id] })}
                            disabled={saveOptions.isPending}
                          >
                            {saveOptions.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar Opções'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pl-7">
                        {getOptionsForQuestion(q.id).length > 0 ? (
                          <div className="space-y-1">
                            {getOptionsForQuestion(q.id).map((opt) => (
                              <div
                                key={opt.id}
                                className={`text-sm px-2 py-1 rounded ${opt.is_correct ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}
                              >
                                {opt.is_correct ? '✓ ' : '○ '}
                                {opt.option_text}
                              </div>
                            ))}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-xs"
                              onClick={() => initializeEditingOptions(q.id)}
                            >
                              Editar opções
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => initializeEditingOptions(q.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar Opções
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma pergunta adicionada ainda.
              </p>
            )}

            {/* Add new question */}
            <div className="flex gap-2">
              <Input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Digite a pergunta..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newQuestion.trim()) {
                    addQuestion.mutate(newQuestion);
                  }
                }}
              />
              <Button
                onClick={() => newQuestion.trim() && addQuestion.mutate(newQuestion)}
                disabled={!newQuestion.trim() || addQuestion.isPending}
              >
                {addQuestion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
