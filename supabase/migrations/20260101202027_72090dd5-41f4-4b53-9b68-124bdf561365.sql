-- ============================================
-- PLATAFORMA DE CURSOS - COMPLETE SCHEMA
-- ============================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('PROFESSOR', 'ESTUDANTE', 'ADMIN');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role app_role NOT NULL DEFAULT 'ESTUDANTE',
  status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'BLOQUEADO')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create user_roles table (for RBAC security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 4. Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('INICIANTE', 'INTERMEDIARIO', 'AVANCADO')),
  language TEXT DEFAULT 'Português',
  status TEXT NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO', 'PUBLICADO')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  content_type TEXT NOT NULL CHECK (content_type IN ('VIDEO_UPLOAD', 'YOUTUBE_LINK')),
  video_file_url TEXT,
  youtube_url TEXT,
  duration_seconds INT,
  is_preview_free BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- Function to check if user is course owner
CREATE OR REPLACE FUNCTION public.is_course_owner(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = _course_id AND instructor_id = _user_id
  )
$$;

-- Function to check if user is section's course owner
CREATE OR REPLACE FUNCTION public.is_section_owner(_user_id UUID, _section_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sections s
    JOIN public.courses c ON s.course_id = c.id
    WHERE s.id = _section_id AND c.instructor_id = _user_id
  )
$$;

-- Function to check if user is lesson's course owner
CREATE OR REPLACE FUNCTION public.is_lesson_owner(_user_id UUID, _lesson_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.sections s ON l.section_id = s.id
    JOIN public.courses c ON s.course_id = c.id
    WHERE l.id = _lesson_id AND c.instructor_id = _user_id
  )
$$;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata or default to ESTUDANTE
  user_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    'ESTUDANTE'::app_role
  );
  
  -- Prevent ADMIN creation via signup
  IF user_role = 'ADMIN' THEN
    user_role := 'ESTUDANTE';
  END IF;
  
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    NEW.email,
    user_role
  );
  
  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile (except role/status)"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- USER_ROLES POLICIES
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- COURSES POLICIES
CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (status = 'PUBLICADO');

CREATE POLICY "Instructors can view own courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Professors can create courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid() 
    AND public.get_user_role(auth.uid()) = 'PROFESSOR'
  );

CREATE POLICY "Instructors can update own courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can delete own courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Admins can manage all courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- SECTIONS POLICIES
CREATE POLICY "Anyone can view sections of published courses"
  ON public.sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.status = 'PUBLICADO'
    )
  );

CREATE POLICY "Instructors can view own sections"
  ON public.sections FOR SELECT
  TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));

CREATE POLICY "Instructors can create sections"
  ON public.sections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_course_owner(auth.uid(), course_id));

CREATE POLICY "Instructors can update own sections"
  ON public.sections FOR UPDATE
  TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));

CREATE POLICY "Instructors can delete own sections"
  ON public.sections FOR DELETE
  TO authenticated
  USING (public.is_course_owner(auth.uid(), course_id));

-- LESSONS POLICIES
CREATE POLICY "Anyone can view preview lessons of published courses"
  ON public.lessons FOR SELECT
  USING (
    is_preview_free = TRUE
    AND EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.courses c ON s.course_id = c.id
      WHERE s.id = section_id AND c.status = 'PUBLICADO'
    )
  );

CREATE POLICY "Instructors can view own lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (public.is_section_owner(auth.uid(), section_id));

CREATE POLICY "Instructors can create lessons"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (public.is_section_owner(auth.uid(), section_id));

CREATE POLICY "Instructors can update own lessons"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (public.is_section_owner(auth.uid(), section_id));

CREATE POLICY "Instructors can delete own lessons"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (public.is_section_owner(auth.uid(), section_id));

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket
CREATE POLICY "Professors can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND public.get_user_role(auth.uid()) = 'PROFESSOR'
  );

CREATE POLICY "Professors can view own uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Professors can delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_sections_course ON public.sections(course_id);
CREATE INDEX idx_lessons_section ON public.lessons(section_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);