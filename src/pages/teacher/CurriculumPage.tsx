import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Play,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Loader2,
  Video,
  Youtube,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LessonMaterialsEditor } from '@/components/teacher/LessonMaterialsEditor';
import { QuizEditor } from '@/components/teacher/QuizEditor';

interface Section {
  id: string;
  course_id: string;
  title: string;
  order: number;
}

interface Lesson {
  id: string;
  section_id: string;
  title: string;
  order: number;
  content_type: string;
  video_file_url: string | null;
  youtube_url: string | null;
  text_content: string | null;
  duration_seconds: number | null;
  is_preview_free: boolean;
}

export default function CurriculumPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sectionDialog, setSectionDialog] = useState<{ open: boolean; section?: Section }>({ open: false });
  const [lessonDialog, setLessonDialog] = useState<{ open: boolean; sectionId?: string; lesson?: Lesson }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type?: 'section' | 'lesson'; id?: string }>({ open: false });
  const [lessonSettingsDialog, setLessonSettingsDialog] = useState<{ open: boolean; lesson?: Lesson }>({ open: false });

  const [sectionTitle, setSectionTitle] = useState('');
  const [lessonData, setLessonData] = useState({
    title: '',
    content_type: 'YOUTUBE_LINK' as string,
    youtube_url: '',
    text_content: '',
    is_preview_free: false,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch course
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch sections
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('course_id', courseId)
        .order('order');
      if (error) throw error;
      return data as Section[];
    },
    enabled: !!courseId,
  });

  // Fetch lessons
  const { data: lessons } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      if (!sections?.length) return [];
      const sectionIds = sections.map((s) => s.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .in('section_id', sectionIds)
        .order('order');
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!sections?.length,
  });

  // Create section
  const createSection = useMutation({
    mutationFn: async (title: string) => {
      const maxOrder = sections?.length ? Math.max(...sections.map((s) => s.order)) : -1;
      const { error } = await supabase.from('sections').insert({
        course_id: courseId,
        title,
        order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', courseId] });
      toast.success('Seção criada!');
      setSectionDialog({ open: false });
      setSectionTitle('');
    },
    onError: () => toast.error('Erro ao criar seção'),
  });

  // Update section
  const updateSection = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from('sections').update({ title }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', courseId] });
      toast.success('Seção atualizada!');
      setSectionDialog({ open: false });
      setSectionTitle('');
    },
    onError: () => toast.error('Erro ao atualizar seção'),
  });

  // Delete section
  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      toast.success('Seção excluída!');
      setDeleteDialog({ open: false });
    },
    onError: () => toast.error('Erro ao excluir seção'),
  });

  // Create/Update lesson
  const saveLesson = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let video_file_url = lessonDialog.lesson?.video_file_url || null;

      // Upload video if selected
      if (videoFile && lessonData.content_type === 'VIDEO_UPLOAD') {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${courseId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
        video_file_url = urlData.publicUrl;
      }

      const lessonPayload = {
        title: lessonData.title,
        content_type: lessonData.content_type,
        youtube_url: lessonData.content_type === 'YOUTUBE_LINK' ? lessonData.youtube_url : null,
        video_file_url: lessonData.content_type === 'VIDEO_UPLOAD' ? video_file_url : null,
        text_content: lessonData.content_type === 'TEXTO' ? lessonData.text_content : null,
        is_preview_free: lessonData.is_preview_free,
      };

      if (lessonDialog.lesson) {
        // Update
        const { error } = await supabase
          .from('lessons')
          .update(lessonPayload)
          .eq('id', lessonDialog.lesson.id);
        if (error) throw error;
      } else {
        // Create
        const sectionLessons = lessons?.filter((l) => l.section_id === lessonDialog.sectionId) || [];
        const maxOrder = sectionLessons.length ? Math.max(...sectionLessons.map((l) => l.order)) : -1;
        
        const { error } = await supabase.from('lessons').insert({
          ...lessonPayload,
          section_id: lessonDialog.sectionId,
          order: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      toast.success(lessonDialog.lesson ? 'Aula atualizada!' : 'Aula criada!');
      closeLessonDialog();
    },
    onError: () => toast.error('Erro ao salvar aula'),
    onSettled: () => setUploading(false),
  });

  // Delete lesson
  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      toast.success('Aula excluída!');
      setDeleteDialog({ open: false });
    },
    onError: () => toast.error('Erro ao excluir aula'),
  });

  const openSectionDialog = (section?: Section) => {
    setSectionTitle(section?.title || '');
    setSectionDialog({ open: true, section });
  };

  const openLessonDialog = (sectionId: string, lesson?: Lesson) => {
    setLessonData({
      title: lesson?.title || '',
      content_type: lesson?.content_type || 'YOUTUBE_LINK',
      youtube_url: lesson?.youtube_url || '',
      text_content: lesson?.text_content || '',
      is_preview_free: lesson?.is_preview_free || false,
    });
    setVideoFile(null);
    setLessonDialog({ open: true, sectionId, lesson });
  };

  const closeLessonDialog = () => {
    setLessonDialog({ open: false });
    setLessonData({ title: '', content_type: 'YOUTUBE_LINK', youtube_url: '', text_content: '', is_preview_free: false });
    setVideoFile(null);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getLessonsForSection = (sectionId: string) => {
    return lessons?.filter((l) => l.section_id === sectionId) || [];
  };

  if (courseLoading || sectionsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course || course.instructor_id !== authUser?.id) {
    navigate('/teacher/courses');
    return null;
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
              <h1 className="text-3xl font-display font-bold text-foreground">Conteúdo do Curso</h1>
              <p className="text-muted-foreground mt-1">{course.title}</p>
            </div>
            <Button onClick={() => openSectionDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Seção
            </Button>
          </div>
        </div>

        {/* Sections List */}
        <div className="space-y-4">
          {sections && sections.length > 0 ? (
            sections.map((section, index) => (
              <Card key={section.id}>
                <Collapsible
                  open={expandedSections.has(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CardHeader className="py-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          Seção {index + 1}: {section.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getLessonsForSection(section.id).length} aula(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openSectionDialog(section)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteDialog({ open: true, type: 'section', id: section.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-2 pl-12">
                        {getLessonsForSection(section.id).map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {lesson.content_type === 'YOUTUBE_LINK' ? (
                                <Youtube className="h-4 w-4 text-primary" />
                              ) : lesson.content_type === 'VIDEO_UPLOAD' ? (
                                <Video className="h-4 w-4 text-primary" />
                              ) : lesson.content_type === 'TEXTO' ? (
                                <FileText className="h-4 w-4 text-primary" />
                              ) : (
                                <HelpCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{lesson.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {lesson.is_preview_free && (
                                  <span className="badge-accent text-xs">Prévia Grátis</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setLessonSettingsDialog({ open: true, lesson })}
                                title="Materiais e Quiz"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openLessonDialog(section.id, lesson)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeleteDialog({ open: true, type: 'lesson', id: lesson.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => openLessonDialog(section.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Aula
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma seção ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando a primeira seção do seu curso
                </p>
                <Button onClick={() => openSectionDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Seção
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Section Dialog */}
      <Dialog open={sectionDialog.open} onOpenChange={(open) => !open && setSectionDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sectionDialog.section ? 'Editar Seção' : 'Nova Seção'}</DialogTitle>
            <DialogDescription>
              {sectionDialog.section ? 'Atualize o título da seção' : 'Crie uma nova seção para organizar as aulas'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-title">Título da Seção</Label>
              <Input
                id="section-title"
                placeholder="Ex: Introdução ao Curso"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialog({ open: false })}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (sectionDialog.section) {
                  updateSection.mutate({ id: sectionDialog.section.id, title: sectionTitle });
                } else {
                  createSection.mutate(sectionTitle);
                }
              }}
              disabled={!sectionTitle.trim() || createSection.isPending || updateSection.isPending}
            >
              {createSection.isPending || updateSection.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialog.open} onOpenChange={(open) => !open && closeLessonDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{lessonDialog.lesson ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
            <DialogDescription>
              Adicione o conteúdo da aula
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Título da Aula</Label>
              <Input
                id="lesson-title"
                placeholder="Ex: Bem-vindo ao curso"
                value={lessonData.title}
                onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Conteúdo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={lessonData.content_type === 'YOUTUBE_LINK' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLessonData({ ...lessonData, content_type: 'YOUTUBE_LINK' })}
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  YouTube
                </Button>
                <Button
                  type="button"
                  variant={lessonData.content_type === 'VIDEO_UPLOAD' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLessonData({ ...lessonData, content_type: 'VIDEO_UPLOAD' })}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={lessonData.content_type === 'TEXTO' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLessonData({ ...lessonData, content_type: 'TEXTO' })}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Texto
                </Button>
                <Button
                  type="button"
                  variant={lessonData.content_type === 'QUIZ' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLessonData({ ...lessonData, content_type: 'QUIZ' })}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Quiz
                </Button>
              </div>
            </div>

            {lessonData.content_type === 'YOUTUBE_LINK' && (
              <div className="space-y-2">
                <Label htmlFor="youtube-url">URL do YouTube</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={lessonData.youtube_url}
                  onChange={(e) => setLessonData({ ...lessonData, youtube_url: e.target.value })}
                />
              </div>
            )}

            {lessonData.content_type === 'VIDEO_UPLOAD' && (
              <div className="space-y-2">
                <Label htmlFor="video-file">Arquivo de Vídeo</Label>
                <Input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: MP4, WebM, OGG. Máximo: 100MB
                </p>
                {lessonDialog.lesson?.video_file_url && !videoFile && (
                  <p className="text-xs text-muted-foreground">
                    Vídeo atual já carregado. Selecione um novo para substituir.
                  </p>
                )}
              </div>
            )}

            {lessonData.content_type === 'TEXTO' && (
              <div className="space-y-2">
                <Label htmlFor="text-content">Conteúdo da Aula</Label>
                <Textarea
                  id="text-content"
                  placeholder="Digite o conteúdo da aula..."
                  value={lessonData.text_content}
                  onChange={(e) => setLessonData({ ...lessonData, text_content: e.target.value })}
                  rows={8}
                />
              </div>
            )}

            {lessonData.content_type === 'QUIZ' && (
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Após criar a aula, use o botão de configurações (engrenagem) para adicionar as perguntas do quiz.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="preview-free"
                checked={lessonData.is_preview_free}
                onChange={(e) => setLessonData({ ...lessonData, is_preview_free: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="preview-free" className="text-sm font-normal">
                Disponibilizar como prévia gratuita
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeLessonDialog}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveLesson.mutate()}
              disabled={!lessonData.title.trim() || uploading || saveLesson.isPending}
            >
              {uploading || saveLesson.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Enviando...' : 'Salvando...'}
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleteDialog.type === 'section' ? 'seção' : 'aula'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'section'
                ? 'Esta ação excluirá a seção e todas as suas aulas. Não pode ser desfeita.'
                : 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteDialog.type === 'section' && deleteDialog.id) {
                  deleteSection.mutate(deleteDialog.id);
                } else if (deleteDialog.type === 'lesson' && deleteDialog.id) {
                  deleteLesson.mutate(deleteDialog.id);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lesson Settings Dialog (Materials & Quiz) */}
      <Dialog open={lessonSettingsDialog.open} onOpenChange={(open) => !open && setLessonSettingsDialog({ open: false })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Aula: {lessonSettingsDialog.lesson?.title}</DialogTitle>
            <DialogDescription>Adicione materiais extras e quizzes para esta aula</DialogDescription>
          </DialogHeader>
          {lessonSettingsDialog.lesson && (
            <div className="space-y-4">
              <LessonMaterialsEditor lessonId={lessonSettingsDialog.lesson.id} courseId={courseId!} />
              <QuizEditor lessonId={lessonSettingsDialog.lesson.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
