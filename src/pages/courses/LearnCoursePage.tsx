import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  BookOpen,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  Circle,
  FileText,
  MessageCircle,
  HelpCircle,
  Video,
  Youtube,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { LessonMaterials } from '@/components/lesson/LessonMaterials';
import { LessonComments } from '@/components/lesson/LessonComments';
import { LessonQuiz } from '@/components/lesson/LessonQuiz';

type LessonWithProgress = {
  id: string;
  title: string;
  section_id: string;
  order_index: number;
  content_type: string;
  video_file_url: string | null;
  youtube_url: string | null;
  duration_seconds: number | null;
  is_preview_free: boolean;
  completed: boolean;
  description: string | null;
  text_content: string | null;
};

type Section = {
  id: string;
  title: string;
  order_index: number;
  course_id: string;
};

export default function LearnCoursePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authUser, user } = useAuth();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Check enrollment
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['enrollment', courseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId!)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user?.id,
  });

  // Fetch course
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['learn-course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch sections
  const { data: sections } = useQuery({
    queryKey: ['learn-sections', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('course_id', courseId!)
        .order('order_index');

      if (error) throw error;
      return data as Section[];
    },
    enabled: !!courseId,
  });

  // Fetch lessons
  const { data: lessons } = useQuery({
    queryKey: ['learn-lessons', courseId],
    queryFn: async () => {
      if (!sections?.length) return [];
      const sectionIds = sections.map((s) => s.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .in('section_id', sectionIds)
        .order('order_index');

      if (error) throw error;
      return data;
    },
    enabled: !!sections?.length,
  });

  // Fetch lesson progress
  const { data: lessonProgress } = useQuery({
    queryKey: ['lesson-progress', courseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('course_id', courseId!)
        .eq('user_id', user!.id);

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user?.id,
  });

  // Merge lessons with progress
  const lessonsWithProgress: LessonWithProgress[] = useMemo(() => {
    if (!lessons) return [];
    return lessons.map((lesson) => ({
      ...lesson,
      completed: lessonProgress?.some((p) => p.lesson_id === lesson.id && p.completed) || false,
    }));
  }, [lessons, lessonProgress]);

  // Calculate progress
  const progressPercentage = useMemo(() => {
    if (!lessonsWithProgress.length) return 0;
    const completed = lessonsWithProgress.filter((l) => l.completed).length;
    return Math.round((completed / lessonsWithProgress.length) * 100);
  }, [lessonsWithProgress]);

  // Current lesson
  const currentLesson = useMemo(() => {
    return lessonsWithProgress.find((l) => l.id === currentLessonId);
  }, [lessonsWithProgress, currentLessonId]);

  // Set initial lesson
  useEffect(() => {
    if (lessonsWithProgress.length && !currentLessonId) {
      // Find first incomplete lesson or first lesson
      const firstIncomplete = lessonsWithProgress.find((l) => !l.completed);
      setCurrentLessonId(firstIncomplete?.id || lessonsWithProgress[0]?.id);
      
      // Expand section of current lesson
      const lesson = firstIncomplete || lessonsWithProgress[0];
      if (lesson) {
        setExpandedSections(new Set([lesson.section_id]));
      }
    }
  }, [lessonsWithProgress, currentLessonId]);

  // Toggle lesson complete mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      const existing = lessonProgress?.find((p) => p.lesson_id === lessonId);
      
      if (existing) {
        const { error } = await supabase
          .from('lesson_progress')
          .update({
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lesson_progress').insert({
          user_id: user!.id,
          lesson_id: lessonId,
          course_id: courseId!,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', courseId] });
    },
    onError: () => {
      toast.error('Erro ao atualizar progresso');
    },
  });

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
    return lessonsWithProgress.filter((l) => l.section_id === sectionId);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const goToNextLesson = () => {
    if (!currentLesson || !lessonsWithProgress.length) return;
    const currentIndex = lessonsWithProgress.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex < lessonsWithProgress.length - 1) {
      const nextLesson = lessonsWithProgress[currentIndex + 1];
      setCurrentLessonId(nextLesson.id);
      setExpandedSections(new Set([nextLesson.section_id]));
    }
  };

  const goToPrevLesson = () => {
    if (!currentLesson || !lessonsWithProgress.length) return;
    const currentIndex = lessonsWithProgress.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex > 0) {
      const prevLesson = lessonsWithProgress[currentIndex - 1];
      setCurrentLessonId(prevLesson.id);
      setExpandedSections(new Set([prevLesson.section_id]));
    }
  };

  const getLessonIcon = (contentType: string) => {
    switch (contentType) {
      case 'YOUTUBE_LINK':
        return Youtube;
      case 'VIDEO_UPLOAD':
        return Video;
      case 'TEXTO':
        return FileText;
      case 'QUIZ':
        return HelpCircle;
      default:
        return Play;
    }
  };

  // Loading
  if (courseLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Not enrolled
  if (!enrollment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você precisa estar matriculado neste curso para acessar o conteúdo.
          </p>
          <Link to={`/courses/${courseId}`}>
            <Button>Ver página do curso</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/courses/${courseId}`)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground truncate max-w-[300px]">
            {course?.title}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Progress value={progressPercentage} className="w-32 h-2" />
            <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Video and Comments scroll together */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* Video/Content Area */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              {currentLesson ? (
                currentLesson.content_type === 'YOUTUBE_LINK' && currentLesson.youtube_url ? (
                  <iframe
                    src={getYouTubeEmbedUrl(currentLesson.youtube_url) || ''}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : currentLesson.content_type === 'VIDEO_UPLOAD' && currentLesson.video_file_url ? (
                  <video
                    src={currentLesson.video_file_url}
                    controls
                    className="w-full h-full"
                  />
                ) : currentLesson.content_type === 'TEXTO' ? (
                  <div className="w-full h-full bg-card flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-foreground">{currentLesson.title}</h2>
                      <p className="text-muted-foreground mt-2">Conteúdo de texto disponível abaixo</p>
                    </div>
                  </div>
                ) : currentLesson.content_type === 'QUIZ' ? (
                  <div className="w-full h-full bg-card flex items-center justify-center">
                    <div className="text-center">
                      <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-foreground">{currentLesson.title}</h2>
                      <p className="text-muted-foreground mt-2">Complete o quiz abaixo</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/70">
                    <div className="text-center">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Nenhum conteúdo disponível para esta aula</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/70">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma aula para começar</p>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Info & Content */}
            <div className="p-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={currentLesson?.completed || false}
                    onCheckedChange={(checked) => {
                      if (currentLesson) {
                        toggleCompleteMutation.mutate({
                          lessonId: currentLesson.id,
                          completed: checked as boolean,
                        });
                      }
                    }}
                    className="h-5 w-5"
                  />
                  <div>
                    <h2 className="font-medium text-foreground">
                      {currentLesson?.title || 'Selecione uma aula'}
                    </h2>
                    {currentLesson?.completed && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Aula concluída
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevLesson}
                    disabled={
                      !currentLesson ||
                      lessonsWithProgress.findIndex((l) => l.id === currentLesson.id) === 0
                    }
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    onClick={goToNextLesson}
                    disabled={
                      !currentLesson ||
                      lessonsWithProgress.findIndex((l) => l.id === currentLesson.id) ===
                        lessonsWithProgress.length - 1
                    }
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              {currentLesson && (
                <>
                  {/* Text Content for TEXTO lessons */}
                  {currentLesson.content_type === 'TEXTO' && currentLesson.text_content && (
                    <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                        {currentLesson.text_content}
                      </div>
                    </div>
                  )}

                  {/* Quiz for QUIZ lessons */}
                  {currentLesson.content_type === 'QUIZ' && (
                    <div className="mb-4">
                      <LessonQuiz lessonId={currentLesson.id} />
                    </div>
                  )}

                  {/* Tabs for Description/Materials and Comments */}
                  <Tabs defaultValue="comments" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="description" className="text-xs">
                        <FileText className="h-4 w-4 mr-1" />
                        Descrição & Materiais
                      </TabsTrigger>
                      <TabsTrigger value="comments" className="text-xs">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Comentários
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="description" className="mt-4 space-y-4">
                      {/* Lesson Description */}
                      {currentLesson.description && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="text-sm font-medium text-foreground mb-2">Descrição da Aula</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {currentLesson.description}
                          </p>
                        </div>
                      )}
                      <LessonMaterials lessonId={currentLesson.id} />
                    </TabsContent>
                    <TabsContent value="comments" className="mt-4">
                      <LessonComments lessonId={currentLesson.id} />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar - Right side */}
        <aside className="w-80 border-l border-border bg-card shrink-0 flex flex-col">
          <div className="p-4 border-b border-border shrink-0">
            <h2 className="font-semibold text-foreground">Conteúdo do Curso</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {lessonsWithProgress.filter((l) => l.completed).length} de {lessonsWithProgress.length} aulas concluídas
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {sections?.map((section, sectionIndex) => (
                <Collapsible
                  key={section.id}
                  open={expandedSections.has(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors text-left">
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {sectionIndex + 1}. {section.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getLessonsForSection(section.id).filter((l) => l.completed).length}/
                          {getLessonsForSection(section.id).length} aulas
                        </p>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 space-y-1 pb-2">
                      {getLessonsForSection(section.id).map((lesson) => {
                        const LessonIcon = getLessonIcon(lesson.content_type);
                        const isActive = lesson.id === currentLessonId;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              setCurrentLessonId(lesson.id);
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted text-foreground'
                            )}
                          >
                            {lesson.completed ? (
                              <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <LessonIcon className="h-4 w-4 shrink-0" />
                            <span className="text-sm truncate flex-1">{lesson.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
