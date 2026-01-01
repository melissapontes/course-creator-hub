-- Adicionar novos tipos de conteúdo para aulas
ALTER TYPE lesson_content_type ADD VALUE IF NOT EXISTS 'TEXTO';
ALTER TYPE lesson_content_type ADD VALUE IF NOT EXISTS 'QUIZ';

-- Adicionar coluna text_content para aulas de texto
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS text_content TEXT;
