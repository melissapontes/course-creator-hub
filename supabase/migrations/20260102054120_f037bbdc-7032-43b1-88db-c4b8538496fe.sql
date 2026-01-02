-- Create course_ratings table for student reviews
CREATE TABLE public.course_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- Enable RLS
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view course ratings"
ON public.course_ratings
FOR SELECT
USING (true);

CREATE POLICY "Enrolled users can create ratings"
ON public.course_ratings
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.course_id = course_ratings.course_id
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own ratings"
ON public.course_ratings
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own ratings"
ON public.course_ratings
FOR DELETE
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_course_ratings_updated_at
BEFORE UPDATE ON public.course_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();