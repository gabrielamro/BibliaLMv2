-- Create the image_bank table
CREATE TABLE IF NOT EXISTS public.image_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    image_url TEXT NOT NULL,
    prompt TEXT,
    style TEXT DEFAULT 'default',
    reference TEXT,
    label TEXT NOT NULL,
    category TEXT DEFAULT 'IA',
    is_ai BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.image_bank ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (Shared bank)
CREATE POLICY "Leitura pública para banco de imagens" 
ON public.image_bank FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert their own images
CREATE POLICY "Usuários autenticados podem adicionar ao acervo" 
ON public.image_bank FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Optional: Index for faster searching
CREATE INDEX IF NOT EXISTS idx_image_bank_label ON public.image_bank USING GIN (to_tsvector('portuguese', label));
CREATE INDEX IF NOT EXISTS idx_image_bank_category ON public.image_bank (category);
CREATE INDEX IF NOT EXISTS idx_image_bank_created_at ON public.image_bank (created_at DESC);
