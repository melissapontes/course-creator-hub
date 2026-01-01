-- Create lesson_comments table
CREATE TABLE public.lesson_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- Enrolled users can view comments
CREATE POLICY "Enrolled users can view lesson comments"
ON public.lesson_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.sections s ON l.section_id = s.id
    JOIN public.enrollments e ON e.course_id = s.course_id
    WHERE l.id = lesson_comments.lesson_id
    AND e.user_id = auth.uid()
  )
);

-- Instructors can view comments on their lessons
CREATE POLICY "Instructors can view their lesson comments"
ON public.lesson_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.sections s ON l.section_id = s.id
    JOIN public.courses c ON s.course_id = c.id
    WHERE l.id = lesson_comments.lesson_id
    AND c.instructor_id = auth.uid()
  )
);

-- Enrolled users can create comments
CREATE POLICY "Enrolled users can create comments"
ON public.lesson_comments FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.sections s ON l.section_id = s.id
    JOIN public.enrollments e ON e.course_id = s.course_id
    WHERE l.id = lesson_comments.lesson_id
    AND e.user_id = auth.uid()
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.lesson_comments FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.lesson_comments FOR DELETE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_lesson_comments_updated_at
BEFORE UPDATE ON public.lesson_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Allow enrolled students to view lessons
CREATE POLICY "Enrolled users can view course lessons"
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sections s
    JOIN public.enrollments e ON e.course_id = s.course_id
    WHERE s.id = lessons.section_id
    AND e.user_id = auth.uid()
  )
);

-- Allow enrolled users to view sections
CREATE POLICY "Enrolled users can view course sections"
ON public.sections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = sections.course_id
    AND e.user_id = auth.uid()
  )
);