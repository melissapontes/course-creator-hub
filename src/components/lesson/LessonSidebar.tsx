import { CheckCircle, Circle, Play, ChevronDown, ChevronRight, Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Lesson {
  id: string;
  title: string;
  section_id: string;
  order: number;
  duration_seconds?: number | null;
  is_preview_free: boolean;
}

interface Section {
  id: string;
  title: string;
  order: number;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

interface LessonSidebarProps {
  sections: Section[];
  lessons: Lesson[];
  progress: LessonProgress[];
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  courseTitle: string;
  isOwner?: boolean;
  courseId?: string;
}

export function LessonSidebar({
  sections,
  lessons,
  progress,
  currentLessonId,
  onSelectLesson,
  courseTitle,
  isOwner = false,
  courseId,
}: LessonSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const currentLesson = lessons.find(l => l.id === currentLessonId);
    return currentLesson ? new Set([currentLesson.section_id]) : new Set();
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
    return lessons
      .filter(l => l.section_id === sectionId)
      .sort((a, b) => a.order - b.order);
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some(p => p.lesson_id === lessonId && p.completed);
  };

  const completedCount = progress.filter(p => p.completed).length;
  const totalLessons = lessons.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Course Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground line-clamp-2 flex-1">{courseTitle}</h2>
          {isOwner && courseId && (
            <Link to={`/teacher/courses/${courseId}/curriculum`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        {/* Only show progress for students */}
        {!isOwner && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {completedCount} de {totalLessons} aulas concluídas
            </p>
          </div>
        )}
        {isOwner && (
          <p className="text-xs text-muted-foreground">
            {totalLessons} aula(s) • {sections.length} seção(ões)
          </p>
        )}
      </div>

      {/* Curriculum */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section, sectionIndex) => {
              const sectionLessons = getLessonsForSection(section.id);
              const sectionCompleted = sectionLessons.filter(l => isLessonCompleted(l.id)).length;

              return (
                <Collapsible
                  key={section.id}
                  open={expandedSections.has(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium line-clamp-1">
                          Seção {sectionIndex + 1}: {section.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isOwner 
                            ? `${sectionLessons.length} aula(s)`
                            : `${sectionCompleted}/${sectionLessons.length} concluídas`
                          }
                        </p>
                      </div>
                      {/* Edit section button for owner */}
                      {isOwner && courseId && (
                        <Link 
                          to={`/teacher/courses/${courseId}/curriculum?section=${section.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 space-y-1 pb-2">
                      {sectionLessons.map((lesson, lessonIndex) => {
                        const isCompleted = isLessonCompleted(lesson.id);
                        const isCurrent = lesson.id === currentLessonId;

                        return (
                          <div
                            key={lesson.id}
                            className={cn(
                              'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
                              isCurrent
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-muted/50'
                            )}
                          >
                            <button
                              onClick={() => onSelectLesson(lesson.id)}
                              className="flex items-start gap-3 flex-1 min-w-0"
                            >
                              <div className="shrink-0 mt-0.5">
                                {!isOwner && isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : isCurrent ? (
                                  <Play className="w-5 h-5 text-primary" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    'text-sm line-clamp-2',
                                    isCurrent ? 'font-medium text-primary' : 'text-foreground'
                                  )}
                                >
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                                {lesson.duration_seconds && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatDuration(lesson.duration_seconds)}
                                  </p>
                                )}
                              </div>
                            </button>
                            {/* Edit lesson button for owner */}
                            {isOwner && courseId && (
                              <Link 
                                to={`/teacher/courses/${courseId}/curriculum?lesson=${lesson.id}`}
                                className="shrink-0"
                              >
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
}
