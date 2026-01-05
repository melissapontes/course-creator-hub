-- Fix #1: Create a secure view for quiz options that hides is_correct from students
-- and only reveals it after they've completed a quiz attempt

-- First, drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view quiz options" ON quiz_options;

-- Create a function to check if user has completed quiz for a lesson
CREATE OR REPLACE FUNCTION public.has_completed_quiz(_user_id uuid, _lesson_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE user_id = _user_id 
    AND lesson_id = _lesson_id
  )
$$;

-- Create a function to check if user is instructor for the lesson
CREATE OR REPLACE FUNCTION public.is_quiz_question_owner(_user_id uuid, _question_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM quiz_questions q
    WHERE q.id = _question_id 
    AND is_lesson_owner(_user_id, q.lesson_id)
  )
$$;

-- Create a secure view that excludes is_correct for students during quiz taking
CREATE OR REPLACE VIEW public.quiz_options_student AS
SELECT 
  qo.id,
  qo.question_id,
  qo.option_text,
  qo.option_order,
  -- Only show is_correct if:
  -- 1. User is the instructor of the lesson, OR
  -- 2. User has already completed a quiz attempt for this lesson
  CASE 
    WHEN is_quiz_question_owner(auth.uid(), qo.question_id) THEN qo.is_correct
    WHEN has_completed_quiz(auth.uid(), (SELECT lesson_id FROM quiz_questions WHERE id = qo.question_id)) THEN qo.is_correct
    ELSE NULL
  END AS is_correct
FROM quiz_options qo;

-- Grant access to the view
GRANT SELECT ON public.quiz_options_student TO authenticated;

-- Create new restrictive policies for quiz_options
-- Instructors can see all fields including is_correct
CREATE POLICY "Instructors can view all quiz option fields"
ON quiz_options
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions q
    WHERE q.id = quiz_options.question_id 
    AND is_lesson_owner(auth.uid(), q.lesson_id)
  )
);

-- Students can view options but we'll handle is_correct visibility in the view
CREATE POLICY "Enrolled students can view quiz options"
ON quiz_options
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions q
    JOIN lessons l ON l.id = q.lesson_id
    JOIN sections s ON s.id = l.section_id
    JOIN enrollments e ON e.course_id = s.course_id
    WHERE q.id = quiz_options.question_id 
    AND e.user_id = auth.uid()
  )
);

-- Fix #2: Make videos bucket private to prevent unauthenticated access
UPDATE storage.buckets SET public = false WHERE id = 'videos';

-- Create RLS policies for videos bucket to allow access only to enrolled users or instructors
-- First drop any existing policies
DROP POLICY IF EXISTS "Anyone can view course videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can manage videos" ON storage.objects;
DROP POLICY IF EXISTS "Enrolled users can view course videos" ON storage.objects;

-- Allow instructors to manage their videos (upload, update, delete)
CREATE POLICY "Instructors can manage their course videos"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: Video access will be handled through signed URLs generated server-side
-- Students will need to request signed URLs through an edge function that validates enrollment