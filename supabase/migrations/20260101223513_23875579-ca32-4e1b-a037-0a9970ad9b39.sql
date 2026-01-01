-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ATIVO',
  UNIQUE(user_id, course_id)
);

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollments
CREATE POLICY "Users can view own enrollments"
ON public.enrollments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can enroll themselves"
ON public.enrollments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can view course enrollments"
ON public.enrollments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.id = course_id AND c.instructor_id = auth.uid()
));

-- RLS policies for lesson_progress
CREATE POLICY "Users can view own progress"
ON public.lesson_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
ON public.lesson_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify own progress"
ON public.lesson_progress FOR UPDATE
USING (user_id = auth.uid());

-- Trigger for updated_at using existing function
CREATE TRIGGER update_lesson_progress_updated_at
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();