-- Fix SECURITY DEFINER views by setting them to SECURITY INVOKER
-- This ensures the views respect the RLS policies of the querying user

ALTER VIEW public.instructor_public_profiles SET (security_invoker = on);
ALTER VIEW public.course_ratings_public SET (security_invoker = on);

-- Grant SELECT on the views to authenticated and anon roles
GRANT SELECT ON public.instructor_public_profiles TO anon, authenticated;
GRANT SELECT ON public.course_ratings_public TO anon, authenticated;