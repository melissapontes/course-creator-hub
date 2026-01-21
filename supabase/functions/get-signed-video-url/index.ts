/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  lessonId: string;
  videoPath: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client for auth verification
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for storage operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const { lessonId, videoPath }: RequestBody = await req.json();

    if (!lessonId || !videoPath) {
      return new Response(
        JSON.stringify({ error: 'lessonId e videoPath são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Request for lesson:', lessonId, 'video:', videoPath);

    // Check if user is enrolled in the course or is the instructor
    const { data: lesson, error: lessonError } = await adminClient
      .from('lessons')
      .select(`
        id,
        is_preview_free,
        video_file_url,
        sections!inner(
          courses!inner(
            id,
            instructor_id,
            status
          )
        )
      `)
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error('Lesson not found:', lessonError);
      return new Response(
        JSON.stringify({ error: 'Aula não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Access nested data from the query
    const sections = lesson.sections as any;
    const course = sections?.courses;
    if (!course) {
      console.error('Course not found for lesson');
      return new Response(
        JSON.stringify({ error: 'Curso não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!course) {
      console.error('Course not found for lesson');
      return new Response(
        JSON.stringify({ error: 'Curso não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if it's a free preview lesson (published courses only)
    const isPreviewAllowed = lesson.is_preview_free && course.status === 'PUBLICADO';

    // Check if user is the instructor
    const isInstructor = course.instructor_id === user.id;

    // Check if user is enrolled
    const { data: enrollment } = await adminClient
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle();

    const isEnrolled = !!enrollment;

    console.log('Access check - Preview:', isPreviewAllowed, 'Instructor:', isInstructor, 'Enrolled:', isEnrolled);

    // Allow access if: free preview, instructor, or enrolled
    if (!isPreviewAllowed && !isInstructor && !isEnrolled) {
      console.error('Access denied for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Você não tem acesso a este vídeo' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL with 1 hour expiration
    const { data: signedUrlData, error: signedUrlError } = await adminClient
      .storage
      .from('videos')
      .createSignedUrl(videoPath, 3600); // 1 hour expiration

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error generating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar URL do vídeo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signed URL generated successfully');

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
