-- Allow admin to view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.enrollments
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Allow admin to view all profiles (policy already exists but let's ensure it covers all cases)
-- The existing policy should work, but let's also allow admin to see lesson_comments and other data

-- Allow admin to view all lesson comments
CREATE POLICY "Admins can view all lesson comments"
ON public.lesson_comments
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Allow admin to view all course ratings
CREATE POLICY "Admins can view all course ratings"
ON public.course_ratings
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'::app_role));