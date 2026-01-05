import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/lesson/VideoPlayer';
import { LessonSidebar } from '@/components/lesson/LessonSidebar';
import { LessonCommentsSection } from '@/components/lesson/LessonCommentsSection';
import { LessonTextContent } from '@/components/lesson/LessonTextContent';
import { LessonQuiz } from '@/components/lesson/LessonQuiz';
import { CourseInfoEditor } from '@/components/teacher/CourseInfoEditor';
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FileText,
  MessageCircle,
  Info,
  HelpCircle,
  Pencil,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export default function LearnCoursePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editInfoOpen, setEditInfoOpen] = useState(false);

  // Verify enrollment or course ownership (for professors)
  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: ['course-access', courseId, user?.id],
    queryFn: async () => {
      // Check enrollment first
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (enrollmentError) throw enrollmentError;
      if (enrollment) return { hasAccess: true, isOwner: false };

      // Check if user is the course owner (professor)
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) throw courseError;
      if (course?.instructor_id === user!.id) return { hasAccess: true, isOwner: true };

      return { hasAccess: false, isOwner: false };
    },
    enabled: !!courseId && !!user?.id,
  });

  const isOwner = accessData?.isOwner ?? false;

  // Fetch course
  const { data: course } = useQuery({
    queryKey: ['learn-course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!accessData?.hasAccess,
  });

  // Fetch sections
  const { data: sections } = useQuery({
    queryKey: ['learn-sections', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('course_id', courseId)
        .order('order');

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!accessData?.hasAccess,
  });

  // Fetch lessons
  const { data: lessons } = useQuery({
    queryKey: ['learn-lessons', courseId],
    queryFn: async () => {
      if (!sections?.length) return [];
      const sectionIds = sections.map(s => s.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .in('section_id', sectionIds)
        .order('order');

      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!sections?.length && !!accessData?.hasAccess,
  });

  // Fetch progress (only for students)
  const { data: progress } = useQuery({
    queryKey: ['lesson-progress', courseId, user?.id],
    queryFn: async () => {
      if (!lessons?.length || isOwner) return [];
      const lessonIds = lessons.map(l => l.id);
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user!.id)
        .in('lesson_id', lessonIds);

      if (error) throw error;
      return data;
    },
    enabled: !!lessons?.length && !!user?.id && !isOwner,
  });

  // Set initial lesson
  useEffect(() => {
    if (lessons?.length && !currentLessonId) {
      if (isOwner) {
        setCurrentLessonId(lessons[0].id);
      } else {
        const firstIncomplete = lessons.find(
          l => !progress?.some(p => p.lesson_id === l.id && p.completed)
        );
        setCurrentLessonId(firstIncomplete?.id || lessons[0].id);
      }
    }
  }, [lessons, progress, currentLessonId, isOwner]);

  // Get current lesson
  const currentLesson = lessons?.find(l => l.id === currentLessonId);

  // Toggle completion mutation (only for students)
  const toggleCompletion = useMutation({
    mutationFn: async (lessonId: string) => {
      const existing = progress?.find(p => p.lesson_id === lessonId);

      if (existing) {
        const { error } = await supabase
          .from('lesson_progress')
          .update({
            completed: !existing.completed,
            completed_at: !existing.completed ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lesson_progress').insert({
          user_id: user!.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', courseId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      toast.success('Progresso atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar progresso');
    },
  });

  // Navigation
  const currentIndex = lessons?.findIndex(l => l.id === currentLessonId) ?? -1;
  const prevLesson = currentIndex > 0 ? lessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex < (lessons?.length ?? 0) - 1 ? lessons?.[currentIndex + 1] : null;

  const isCurrentCompleted = progress?.some(p => p.lesson_id === currentLessonId && p.completed);

  // Determine content type
  const isVideoLesson = currentLesson?.content_type === 'YOUTUBE_LINK' || currentLesson?.content_type === 'VIDEO_UPLOAD';
  const isTextLesson = currentLesson?.content_type === 'TEXTO';
  const isQuizLesson = currentLesson?.content_type === 'QUIZ';

  // Loading state
  if (accessLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="w-48 h-6 mx-auto" />
        </div>
      </div>
    );
  }

  // Not enrolled and not owner
  if (!accessData?.hasAccess) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground mb-6">
              Você precisa estar matriculado neste curso para acessar as aulas.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to={`/courses/${courseId}`}>
                <Button variant="outline">Ver Curso</Button>
              </Link>
              <Link to="/courses">
                <Button>Explorar Cursos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isOwner ? '/teacher' : '/student')}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="font-medium text-foreground line-clamp-1">{course?.title}</h1>
              {isOwner && (
                <Badge variant="secondary" className="text-xs">
                  <Pencil className="w-3 h-3 mr-1" />
                  Modo Edição
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Course Info Button (Owner only) */}
          {isOwner && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => setEditInfoOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Informações
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content Area - Scrollable */}
        <ScrollArea className="flex-1">
          <div className="min-h-full">
            {/* Video Player or Content */}
            {isVideoLesson && (
              <div className="bg-black">
                {currentLesson ? (
                  <div className="max-w-5xl mx-auto">
                    <VideoPlayer
                      youtubeUrl={currentLesson.youtube_url}
                      videoFileUrl={currentLesson.video_file_url}
                      title={currentLesson.title}
                      lessonId={currentLesson.id}
                      onComplete={() => {
                        if (!isOwner && !isCurrentCompleted) {
                          toggleCompletion.mutate(currentLessonId!);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center max-w-5xl mx-auto">
                    <Skeleton className="w-full h-full" />
                  </div>
                )}
              </div>
            )}

            {isTextLesson && currentLesson && (
              <div className="max-w-5xl mx-auto p-4 md:p-6">
                <LessonTextContent 
                  content={currentLesson.text_content || ''} 
                  title={currentLesson.title} 
                />
              </div>
            )}

            {isQuizLesson && currentLesson && (
              <div className="max-w-3xl mx-auto p-4 md:p-6">
                <LessonQuiz lessonId={currentLesson.id} />
              </div>
            )}

            {/* Lesson Info & Controls */}
            <div className="border-b border-border bg-card">
              <div className="max-w-5xl mx-auto p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {isTextLesson && <FileText className="h-5 w-5 text-primary" />}
                    {isQuizLesson && <HelpCircle className="h-5 w-5 text-primary" />}
                    <h2 className="text-xl font-semibold text-foreground">
                      {currentLesson?.title || 'Carregando...'}
                    </h2>
                    {/* Edit lesson button for owner */}
                    {isOwner && currentLesson && (
                      <Link to={`/teacher/courses/${courseId}/curriculum?lesson=${currentLesson.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  {/* Only show completion button for students */}
                  {!isOwner && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isCurrentCompleted ? 'secondary' : 'default'}
                        onClick={() => currentLessonId && toggleCompletion.mutate(currentLessonId)}
                        disabled={toggleCompletion.isPending}
                      >
                        <CheckCircle
                          className={cn('w-4 h-4 mr-2', isCurrentCompleted && 'text-green-500')}
                        />
                        {isCurrentCompleted ? 'Concluída' : 'Marcar como Concluída'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => prevLesson && setCurrentLessonId(prevLesson.id)}
                    disabled={!prevLesson}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </Button>
                  <Button
                    onClick={() => nextLesson && setCurrentLessonId(nextLesson.id)}
                    disabled={!nextLesson}
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs Content */}
            <div className="max-w-5xl mx-auto p-4">
              <Tabs defaultValue="comments" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="comments" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Comentários
                  </TabsTrigger>
                  <TabsTrigger value="about" className="gap-2">
                    <Info className="w-4 h-4" />
                    Sobre
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="comments">
                  {currentLessonId && (
                    <LessonCommentsSection lessonId={currentLessonId} />
                  )}
                </TabsContent>
                <TabsContent value="about">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Sobre o Curso</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {course?.description || 'Sem descrição disponível.'}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar */}
        <div
          className={cn(
            'w-80 shrink-0 transition-all duration-300 border-l border-border',
            'fixed lg:static inset-y-14 right-0 z-40 bg-card',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0'
          )}
        >
          {sections && lessons && course && (
            <LessonSidebar
              sections={sections}
              lessons={lessons}
              progress={progress || []}
              currentLessonId={currentLessonId || ''}
              onSelectLesson={setCurrentLessonId}
              courseTitle={course.title}
              isOwner={isOwner}
              courseId={courseId!}
            />
          )}
        </div>
      </div>

      {/* Course Info Editor Modal */}
      {isOwner && course && (
        <CourseInfoEditor
          open={editInfoOpen}
          onOpenChange={setEditInfoOpen}
          course={course}
        />
      )}
    </div>
  );
}
