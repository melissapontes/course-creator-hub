import { CheckCircle, Circle, Play, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
}

export function LessonSidebar({
  sections,
  lessons,
  progress,
  currentLessonId,
  onSelectLesson,
  courseTitle,
}: LessonSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Auto-expand section containing current lesson
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
        <h2 className="font-semibold text-foreground line-clamp-2 mb-3">{courseTitle}</h2>
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
                          {sectionCompleted}/{sectionLessons.length} concluídas
                        </p>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 space-y-1 pb-2">
                      {sectionLessons.map((lesson, lessonIndex) => {
                        const isCompleted = isLessonCompleted(lesson.id);
                        const isCurrent = lesson.id === currentLessonId;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onSelectLesson(lesson.id)}
                            className={cn(
                              'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
                              isCurrent
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-muted/50'
                            )}
                          >
                            <div className="shrink-0 mt-0.5">
                              {isCompleted ? (
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
