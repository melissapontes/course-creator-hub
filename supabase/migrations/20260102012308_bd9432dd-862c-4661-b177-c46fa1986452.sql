-- Add text_content column to lessons for text-based lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS text_content TEXT;

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_options table for multiple choice answers
CREATE TABLE public.quiz_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  option_order INTEGER NOT NULL DEFAULT 0
);

-- Create quiz_attempts table to track student attempts
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on all tables
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz Questions Policies
-- Instructors can manage their own lesson quizzes
CREATE POLICY "Instructors can view own lesson quizzes"
ON public.quiz_questions FOR SELECT
USING (is_lesson_owner(auth.uid(), lesson_id));

CREATE POLICY "Instructors can create quizzes"
ON public.quiz_questions FOR INSERT
WITH CHECK (is_lesson_owner(auth.uid(), lesson_id));

CREATE POLICY "Instructors can update own quizzes"
ON public.quiz_questions FOR UPDATE
USING (is_lesson_owner(auth.uid(), lesson_id));

CREATE POLICY "Instructors can delete own quizzes"
ON public.quiz_questions FOR DELETE
USING (is_lesson_owner(auth.uid(), lesson_id));

-- Enrolled users can view quizzes
CREATE POLICY "Enrolled users can view quizzes"
ON public.quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN sections s ON l.section_id = s.id
    JOIN enrollments e ON e.course_id = s.course_id
    WHERE l.id = quiz_questions.lesson_id AND e.user_id = auth.uid()
  )
);

-- Quiz Options Policies
-- Anyone who can see questions can see options
CREATE POLICY "Users can view quiz options"
ON public.quiz_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions q WHERE q.id = quiz_options.question_id
  )
);

-- Instructors can manage options
CREATE POLICY "Instructors can create quiz options"
ON public.quiz_options FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quiz_questions q
    WHERE q.id = quiz_options.question_id AND is_lesson_owner(auth.uid(), q.lesson_id)
  )
);

CREATE POLICY "Instructors can update quiz options"
ON public.quiz_options FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions q
    WHERE q.id = quiz_options.question_id AND is_lesson_owner(auth.uid(), q.lesson_id)
  )
);

CREATE POLICY "Instructors can delete quiz options"
ON public.quiz_options FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions q
    WHERE q.id = quiz_options.question_id AND is_lesson_owner(auth.uid(), q.lesson_id)
  )
);

-- Quiz Attempts Policies
-- Users can view own attempts
CREATE POLICY "Users can view own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (user_id = auth.uid());

-- Users can create own attempts
CREATE POLICY "Users can create own quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update own attempts
CREATE POLICY "Users can update own quiz attempts"
ON public.quiz_attempts FOR UPDATE
USING (user_id = auth.uid());

-- Instructors can view attempts on their courses
CREATE POLICY "Instructors can view course quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN sections s ON l.section_id = s.id
    JOIN courses c ON s.course_id = c.id
    WHERE l.id = quiz_attempts.lesson_id AND c.instructor_id = auth.uid()
  )
);