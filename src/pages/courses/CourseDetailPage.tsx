import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  GraduationCap,
  Globe,
  Play,
  Lock,
  ChevronDown,
  ChevronRight,
  User,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useEffect } from 'react';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authUser, user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [instructorName, setInstructorName] = useState<string>('');

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['public-course', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch instructor name from profiles
  useEffect(() => {
    if (course?.instructor_id) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', course.instructor_id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setInstructorName(data.full_name);
          }
        });
    }
  }, [course?.instructor_id]);

  const { data: sections } = useQuery({
    queryKey: ['public-sections', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('course_id', id)
        .order('order');

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: lessons } = useQuery({
    queryKey: ['public-lessons', id],
    queryFn: async () => {
      if (!sections?.length) return [];
      const sectionIds = sections.map((s) => s.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, section_id, order, is_preview_free, duration_seconds, content_type')
        .in('section_id', sectionIds)
        .order('order');

      if (error) throw error;
      return data;
    },
    enabled: !!sections?.length,
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
    return lessons?.filter((l) => l.section_id === sectionId) || [];
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      INICIANTE: 'Iniciante',
      INTERMEDIARIO: 'Intermediário',
      AVANCADO: 'Avançado',
    };
    return labels[level] || level;
  };

  const totalLessons = lessons?.length || 0;
  const freeLessons = lessons?.filter((l) => l.is_preview_free).length || 0;

  if (courseLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!course) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Curso não encontrado</h1>
          <p className="text-muted-foreground mb-4">
            O curso que você está procurando não existe ou não está disponível
          </p>
          <Link to="/courses">
            <Button>Ver todos os cursos</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const isProfessor = authUser?.role === 'PROFESSOR';
  const isOwner = course.instructor_id === user?.id;

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              {course.category && (
                <Badge variant="secondary" className="mb-4">
                  {course.category}
                </Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-lg opacity-90 mb-6">{course.subtitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm opacity-80">
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {getLevelLabel(course.level)}
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {course.language || 'Português'}
                </div>
                <div className="flex items-center gap-1">
                  <Play className="w-4 h-4" />
                  {totalLessons} aulas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {course.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Sobre o Curso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {course.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Curriculum */}
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do Curso</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {sections?.length || 0} seções • {totalLessons} aulas
                  {freeLessons > 0 && ` • ${freeLessons} prévia(s) grátis`}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {sections && sections.length > 0 ? (
                  sections.map((section, index) => (
                    <Collapsible
                      key={section.id}
                      open={expandedSections.has(section.id)}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <div className="border border-border rounded-lg overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                            <div className="flex items-center gap-3">
                              {expandedSections.has(section.id) ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">
                                Seção {index + 1}: {section.title}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {getLessonsForSection(section.id).length} aulas
                            </span>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t border-border">
                            {getLessonsForSection(section.id).map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors border-b border-border last:border-b-0"
                              >
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  {lesson.is_preview_free ? (
                                    <Play className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{lesson.title}</p>
                                </div>
                                {lesson.is_preview_free && (
                                  <Badge variant="outline" className="text-xs">
                                    Prévia Grátis
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Conteúdo em breve...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Card */}
            <Card className="sticky top-24">
              <div className="h-48 bg-muted flex items-center justify-center">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-6">
                {isProfessor && isOwner ? (
                  <Link to={`/teacher/courses/${id}/edit`}>
                    <Button className="w-full" variant="outline">
                      Editar Curso
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button className="w-full mb-3" size="lg">
                        Criar conta para acessar
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground text-center">
                      Crie uma conta gratuita para acessar os cursos
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Instructor */}
            {instructorName && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Instrutor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{instructorName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
