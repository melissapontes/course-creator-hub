-- Create a secure view for public instructor data (without email)
CREATE OR REPLACE VIEW public.instructor_public_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.created_at
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM courses c 
  WHERE c.instructor_id = p.id 
  AND c.status = 'PUBLICADO'
);

-- Drop the existing policy that exposes emails
DROP POLICY IF EXISTS "Anyone can view instructor profiles" ON public.profiles;

-- Create a new policy that only allows viewing limited instructor info via the view
-- The view already handles filtering - we don't need public access to profiles directly
-- Instead, users can query the instructor_public_profiles view

-- Create RLS policy to allow reading the view (views inherit table policies by default)
-- Enable RLS on the view doesn't apply - views use their own security context

-- Create a secure view for anonymized ratings (without user_id for public)
CREATE OR REPLACE VIEW public.course_ratings_public AS
SELECT 
  id,
  course_id,
  rating,
  comment,
  created_at
  -- user_id is intentionally excluded for privacy
FROM public.course_ratings;

-- Update the course_ratings policy to be more restrictive for anonymous access
-- Keep the existing policies but note that the view should be used for public access