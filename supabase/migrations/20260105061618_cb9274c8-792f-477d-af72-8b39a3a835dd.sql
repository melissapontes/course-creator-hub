-- Fix the SECURITY DEFINER view warning by dropping it
-- Instead, we'll handle the is_correct visibility in the application layer
DROP VIEW IF EXISTS public.quiz_options_student;