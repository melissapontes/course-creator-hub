-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create lesson progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  watched_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollments
CREATE POLICY "Users can view own enrollments"
ON public.enrollments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves"
ON public.enrollments
FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'ESTUDANTE'));

CREATE POLICY "Users can update own enrollment"
ON public.enrollments
FOR UPDATE
USING (auth.uid() = user_id);

-- Professors can view enrollments for their courses
CREATE POLICY "Professors can view enrollments for own courses"
ON public.enrollments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.courses
  WHERE courses.id = enrollments.course_id
  AND courses.instructor_id = auth.uid()
));

-- RLS policies for lesson_progress
CREATE POLICY "Users can view own lesson progress"
ON public.lesson_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own lesson progress"
ON public.lesson_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress"
ON public.lesson_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get course progress percentage
CREATE OR REPLACE FUNCTION public.get_course_progress(_user_id UUID, _course_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE lp.completed = true)::NUMERIC / 
         NULLIF(COUNT(*)::NUMERIC, 0)) * 100
      )::INTEGER
      FROM public.lessons l
      JOIN public.sections s ON s.id = l.section_id
      LEFT JOIN public.lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = _user_id
      WHERE s.course_id = _course_id
    ),
    0
  )
$$;

-- Function to get enrolled students count for a course
CREATE OR REPLACE FUNCTION public.get_enrollment_count(_course_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.enrollments
  WHERE course_id = _course_id
$$;