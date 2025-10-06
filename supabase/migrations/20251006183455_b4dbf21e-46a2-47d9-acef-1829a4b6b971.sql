-- Tabela de categorias (hierárquica)
CREATE TABLE IF NOT EXISTS public.asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.asset_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de assets
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  mime_type TEXT NOT NULL,
  checksum TEXT NOT NULL UNIQUE,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  copyright_info TEXT,
  usage_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de logs de alteração (governança)
CREATE TABLE IF NOT EXISTS public.asset_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_categories ON public.assets USING gin(categories);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON public.assets USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_assets_checksum ON public.assets(checksum);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.asset_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.asset_categories(parent_id);

-- RLS Policies
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_change_logs ENABLE ROW LEVEL SECURITY;

-- Usuários podem gerenciar seus próprios assets
CREATE POLICY "Users can manage their own assets"
  ON public.assets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem gerenciar suas próprias categorias
CREATE POLICY "Users can manage their own categories"
  ON public.asset_categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver seus próprios logs
CREATE POLICY "Users can view their own logs"
  ON public.asset_change_logs
  FOR SELECT
  USING (auth.uid() = changed_by);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_categories_updated_at
  BEFORE UPDATE ON public.asset_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar focal_point em environments
ALTER TABLE public.environments
ADD COLUMN IF NOT EXISTS focal_point JSONB DEFAULT '{"x": 0.5, "y": 0.5}'::jsonb;

COMMENT ON COLUMN public.environments.focal_point IS 'Ponto focal da imagem de capa {x: 0-1, y: 0-1}';

-- Criar bucket de assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para bucket
CREATE POLICY "Users can upload their own assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'assets');

CREATE POLICY "Users can delete their own assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );