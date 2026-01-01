-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('PROFESSOR', 'ESTUDANTE', 'ADMIN');

-- Create user status enum
CREATE TYPE public.user_status AS ENUM ('ATIVO', 'BLOQUEADO');

-- Create course status enum
CREATE TYPE public.course_status AS ENUM ('RASCUNHO', 'PUBLICADO');

-- Create course level enum
CREATE TYPE public.course_level AS ENUM ('INICIANTE', 'INTERMEDIARIO', 'AVANCADO');

-- Create lesson content type enum
CREATE TYPE public.lesson_content_type AS ENUM ('VIDEO_UPLOAD', 'YOUTUBE_LINK');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status public.user_status DEFAULT 'ATIVO' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create professor_profiles table
CREATE TABLE public.professor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create student_profiles table
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  level public.course_level DEFAULT 'INICIANTE' NOT NULL,
  language TEXT DEFAULT 'pt-BR',
  status public.course_status DEFAULT 'RASCUNHO' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  content_type public.lesson_content_type NOT NULL,
  video_file_url TEXT,
  youtube_url TEXT,
  duration_seconds INTEGER,
  is_preview_free BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
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

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Create function to check if user is course owner
CREATE OR REPLACE FUNCTION public.is_course_owner(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.courses
    WHERE id = _course_id
      AND instructor_id = _user_id
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles (read-only for users)
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for professor_profiles
CREATE POLICY "Anyone can view professor profiles"
  ON public.professor_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Professors can update own profile"
  ON public.professor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'PROFESSOR'));

CREATE POLICY "Professors can insert own profile"
  ON public.professor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'PROFESSOR'));

-- RLS Policies for student_profiles
CREATE POLICY "Users can view own student profile"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile"
  ON public.student_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'ESTUDANTE'));

CREATE POLICY "Students can insert own profile"
  ON public.student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'ESTUDANTE'));

-- RLS Policies for courses
CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (status = 'PUBLICADO' OR (auth.uid() IS NOT NULL AND instructor_id = auth.uid()));

CREATE POLICY "Professors can create courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'PROFESSOR') AND instructor_id = auth.uid());

CREATE POLICY "Professors can update own courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid() AND public.has_role(auth.uid(), 'PROFESSOR'));

CREATE POLICY "Professors can delete own courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid() AND public.has_role(auth.uid(), 'PROFESSOR'));

-- RLS Policies for sections
CREATE POLICY "Anyone can view sections of published courses"
  ON public.sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = sections.course_id 
      AND (courses.status = 'PUBLICADO' OR courses.instructor_id = auth.uid())
    )
  );

CREATE POLICY "Professors can create sections for own courses"
  ON public.sections FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'PROFESSOR') 
    AND public.is_course_owner(auth.uid(), course_id)
  );

CREATE POLICY "Professors can update sections of own courses"
  ON public.sections FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'PROFESSOR') 
    AND public.is_course_owner(auth.uid(), course_id)
  );

CREATE POLICY "Professors can delete sections of own courses"
  ON public.sections FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'PROFESSOR') 
    AND public.is_course_owner(auth.uid(), course_id)
  );

-- RLS Policies for lessons
CREATE POLICY "Anyone can view lessons of published courses"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.courses c ON c.id = s.course_id
      WHERE s.id = lessons.section_id
      AND (c.status = 'PUBLICADO' OR c.instructor_id = auth.uid())
    )
  );

CREATE POLICY "Professors can create lessons for own courses"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'PROFESSOR') 
    AND EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.courses c ON c.id = s.course_id
      WHERE s.id = section_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can update lessons of own courses"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'PROFESSOR') 
    AND EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.courses c ON c.id = s.course_id
      WHERE s.id = section_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can delete lessons of own courses"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'PROFESSOR') 
    AND EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.courses c ON c.id = s.course_id
      WHERE s.id = section_id AND c.instructor_id = auth.uid()
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Get role from metadata
  user_role := (NEW.raw_user_meta_data ->> 'role')::public.app_role;
  
  -- Block ADMIN creation via signup
  IF user_role = 'ADMIN' THEN
    RAISE EXCEPTION 'Cannot create admin via signup';
  END IF;
  
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    NEW.email
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(user_role, 'ESTUDANTE'));
  
  -- Create role-specific profile
  IF user_role = 'PROFESSOR' THEN
    INSERT INTO public.professor_profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Professor'));
  ELSE
    INSERT INTO public.student_profiles (user_id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professor_profiles_updated_at
  BEFORE UPDATE ON public.professor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);

-- Storage policies for videos
CREATE POLICY "Professors can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos' 
    AND public.has_role(auth.uid(), 'PROFESSOR')
  );

CREATE POLICY "Professors can update own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'videos' 
    AND public.has_role(auth.uid(), 'PROFESSOR')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Authenticated users can view videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'videos');

CREATE POLICY "Professors can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos' 
    AND public.has_role(auth.uid(), 'PROFESSOR')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage bucket for thumbnails (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies for thumbnails
CREATE POLICY "Professors can upload thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails' 
    AND public.has_role(auth.uid(), 'PROFESSOR')
  );

CREATE POLICY "Anyone can view thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Professors can update own thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'thumbnails' 
    AND public.has_role(auth.uid(), 'PROFESSOR')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Professors can delete own thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'thumbnails' 
    AND public.has_role(auth.uid(), 'PROFESSOR')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage bucket for avatars (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );