-- Create thumbnails bucket (public for course images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for thumbnails bucket
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "Professors can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thumbnails' AND has_role(auth.uid(), 'PROFESSOR'));

CREATE POLICY "Professors can update own thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'thumbnails' AND has_role(auth.uid(), 'PROFESSOR'));

CREATE POLICY "Professors can delete own thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'thumbnails' AND has_role(auth.uid(), 'PROFESSOR'));

-- Add price field to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;

-- Create cart_items table for shopping cart
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Cart RLS policies
CREATE POLICY "Users can view own cart items"
ON public.cart_items FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can add to own cart"
ON public.cart_items FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from own cart"
ON public.cart_items FOR DELETE
USING (user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_price ON public.courses(price);