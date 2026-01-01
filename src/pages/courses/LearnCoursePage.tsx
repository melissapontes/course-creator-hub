import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/lesson/VideoPlayer';
import { LessonSidebar } from '@/components/lesson/LessonSidebar';
import { LessonCommentsSection } from '@/components/lesson/LessonCommentsSection';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function LearnCoursePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Verify enrollment
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['enrollment', courseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user?.id,
  });

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
    enabled: !!courseId && !!enrollment,
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
    enabled: !!courseId && !!enrollment,
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
      return data;
    },
    enabled: !!sections?.length && !!enrollment,
  });

  // Fetch progress
  const { data: progress } = useQuery({
    queryKey: ['lesson-progress', courseId, user?.id],
    queryFn: async () => {
      if (!lessons?.length) return [];
      const lessonIds = lessons.map(l => l.id);
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user!.id)
        .in('lesson_id', lessonIds);

      if (error) throw error;
      return data;
    },
    enabled: !!lessons?.length && !!user?.id,
  });

  // Set initial lesson
  useEffect(() => {
    if (lessons?.length && !currentLessonId) {
      // Find first incomplete lesson or default to first
      const firstIncomplete = lessons.find(
        l => !progress?.some(p => p.lesson_id === l.id && p.completed)
      );
      setCurrentLessonId(firstIncomplete?.id || lessons[0].id);
    }
  }, [lessons, progress, currentLessonId]);

  // Get current lesson
  const currentLesson = lessons?.find(l => l.id === currentLessonId);

  // Toggle completion mutation
  const toggleCompletion = useMutation({
    mutationFn: async (lessonId: string) => {
      const existing = progress?.find(p => p.lesson_id === lessonId);

      if (existing) {
        // Toggle existing
        const { error } = await supabase
          .from('lesson_progress')
          .update({
            completed: !existing.completed,
            completed_at: !existing.completed ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new
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

  // Loading state
  if (enrollmentLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="w-48 h-6 mx-auto" />
        </div>
      </div>
    );
  }

  // Not enrolled
  if (!enrollment) {
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
            onClick={() => navigate('/student')}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <h1 className="font-medium text-foreground line-clamp-1">{course?.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
        {/* Video & Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Player */}
          <div className="bg-black">
            {currentLesson ? (
              <div className="max-w-5xl mx-auto">
                <VideoPlayer
                  youtubeUrl={currentLesson.youtube_url}
                  videoFileUrl={currentLesson.video_file_url}
                  title={currentLesson.title}
                  onComplete={() => {
                    if (!isCurrentCompleted) {
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

          {/* Lesson Info & Controls */}
          <div className="border-b border-border bg-card">
            <div className="max-w-5xl mx-auto p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {currentLesson?.title || 'Carregando...'}
                  </h2>
                </div>
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
          <div className="flex-1 overflow-auto">
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
        </div>

        {/* Sidebar */}
        <div
          className={cn(
            'w-80 shrink-0 transition-all duration-300 border-l border-border',
            'fixed lg:static inset-y-14 right-0 z-40 bg-card',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0'
          )}
        >
          {sections && lessons && progress && course && (
            <LessonSidebar
              sections={sections}
              lessons={lessons}
              progress={progress}
              currentLessonId={currentLessonId || ''}
              onSelectLesson={setCurrentLessonId}
              courseTitle={course.title}
            />
          )}
        </div>
      </div>
    </div>
  );
}
