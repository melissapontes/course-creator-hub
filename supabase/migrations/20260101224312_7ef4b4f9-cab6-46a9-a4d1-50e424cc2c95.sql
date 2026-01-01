-- Allow anyone to view public profile info (name, avatar) for instructors
CREATE POLICY "Anyone can view instructor profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.instructor_id = profiles.id
    AND c.status = 'PUBLICADO'
  )
);