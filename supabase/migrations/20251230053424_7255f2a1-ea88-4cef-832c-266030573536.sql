-- Add description column to lessons table
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS description TEXT;

-- Create lesson_materials table for downloads, links, text content
CREATE TABLE public.lesson_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('DOWNLOAD', 'LINK', 'TEXT')),
  title TEXT NOT NULL,
  content TEXT, -- URL for downloads/links, text content for TEXT type
  file_url TEXT, -- For uploaded files
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_options table
CREATE TABLE public.quiz_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Create quiz_attempts table for tracking student quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_ratings table
CREATE TABLE public.course_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

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

-- Enable RLS on all new tables
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- RLS for lesson_materials: anyone can view if lesson is viewable
CREATE POLICY "Anyone can view lesson materials of published courses"
ON public.lesson_materials FOR SELECT
USING (EXISTS (
  SELECT 1 FROM lessons l
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  WHERE l.id = lesson_materials.lesson_id
    AND (c.status = 'PUBLICADO' OR c.instructor_id = auth.uid())
));

CREATE POLICY "Professors can manage materials of own courses"
ON public.lesson_materials FOR ALL
USING (has_role(auth.uid(), 'PROFESSOR') AND EXISTS (
  SELECT 1 FROM lessons l
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  WHERE l.id = lesson_materials.lesson_id AND c.instructor_id = auth.uid()
));

-- RLS for quizzes
CREATE POLICY "Anyone can view quizzes of published courses"
ON public.quizzes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM lessons l
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  WHERE l.id = quizzes.lesson_id
    AND (c.status = 'PUBLICADO' OR c.instructor_id = auth.uid())
));

CREATE POLICY "Professors can manage quizzes of own courses"
ON public.quizzes FOR ALL
USING (has_role(auth.uid(), 'PROFESSOR') AND EXISTS (
  SELECT 1 FROM lessons l
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  WHERE l.id = quizzes.lesson_id AND c.instructor_id = auth.uid()
));

-- RLS for quiz_questions
CREATE POLICY "Anyone can view questions of visible quizzes"
ON public.quiz_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM quizzes q
  JOIN lessons l ON l.id = q.lesson_id
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  WHERE q.id = quiz_questions.quiz_id
    AND (c.status = 'PUBLICADO' OR c.instructor_id = auth.uid())
));

CREATE POLICY "Professors can manage questions of own quizzes"
ON public.quiz_questions FOR ALL
USING (has_role(auth.uid(), 'PROFESSOR') AND EXISTS (
  SELECT 1 FROM quizzes q
  JOIN lessons l ON l.id = q.lesson_id
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  WHERE q.id = quiz_questions.quiz_id AND c.instructor_id = auth.uid()
));

-- RLS for quiz_options
CREATE POLICY "Anyone can view options of visible questions"
ON public.quiz_options FOR SELECT
USING (EXISTS (
  SELECT 1 FROM quiz_questions qq
  JOIN quizzes q ON q.id = qq.quiz_id
  JOIN lessons l ON l.id = q.lesson_id
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  WHERE qq.id = quiz_options.question_id
    AND (c.status = 'PUBLICADO' OR c.instructor_id = auth.uid())
));

CREATE POLICY "Professors can manage options of own quizzes"
ON public.quiz_options FOR ALL
USING (has_role(auth.uid(), 'PROFESSOR') AND EXISTS (
  SELECT 1 FROM quiz_questions qq
  JOIN quizzes q ON q.id = qq.quiz_id
  JOIN lessons l ON l.id = q.lesson_id
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  WHERE qq.id = quiz_options.question_id AND c.instructor_id = auth.uid()
));

-- RLS for quiz_attempts
CREATE POLICY "Users can view own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enrolled users can submit quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM quizzes q
  JOIN lessons l ON l.id = q.lesson_id
  JOIN sections s ON s.id = l.section_id
  JOIN enrollments e ON e.course_id = s.course_id
  WHERE q.id = quiz_attempts.quiz_id AND e.user_id = auth.uid()
));

-- RLS for course_ratings
CREATE POLICY "Anyone can view course ratings"
ON public.course_ratings FOR SELECT
USING (true);

CREATE POLICY "Enrolled users can rate courses"
ON public.course_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM enrollments WHERE course_id = course_ratings.course_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update own ratings"
ON public.course_ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
ON public.course_ratings FOR DELETE
USING (auth.uid() = user_id);

-- RLS for lesson_comments
CREATE POLICY "Anyone can view comments of published courses"
ON public.lesson_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM lessons l
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  WHERE l.id = lesson_comments.lesson_id
    AND (c.status = 'PUBLICADO' OR c.instructor_id = auth.uid())
));

CREATE POLICY "Enrolled users can comment on lessons"
ON public.lesson_comments FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM lessons l
  JOIN sections s ON s.id = l.section_id
  JOIN enrollments e ON e.course_id = s.course_id
  WHERE l.id = lesson_comments.lesson_id AND e.user_id = auth.uid()
));

CREATE POLICY "Users can update own comments"
ON public.lesson_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.lesson_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_lesson_materials_updated_at
BEFORE UPDATE ON public.lesson_materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_ratings_updated_at
BEFORE UPDATE ON public.course_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_comments_updated_at
BEFORE UPDATE ON public.lesson_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get course average rating
CREATE OR REPLACE FUNCTION public.get_course_rating(_course_id uuid)
RETURNS TABLE(average_rating NUMERIC, total_ratings INTEGER)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0) as average_rating,
    COUNT(*)::INTEGER as total_ratings
  FROM public.course_ratings
  WHERE course_id = _course_id
$$;

-- Create storage bucket for lesson materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-materials', 'lesson-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for lesson materials
CREATE POLICY "Anyone can view lesson materials files"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-materials');

CREATE POLICY "Professors can upload lesson materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lesson-materials' AND auth.uid() IS NOT NULL);

CREATE POLICY "Professors can update lesson materials"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lesson-materials' AND auth.uid() IS NOT NULL);

CREATE POLICY "Professors can delete lesson materials"
ON storage.objects FOR DELETE
USING (bucket_id = 'lesson-materials' AND auth.uid() IS NOT NULL);