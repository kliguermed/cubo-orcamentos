-- Criar tabela de configurações de template de proposta
CREATE TABLE IF NOT EXISTS public.proposal_template_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Capa principal da proposta
  main_cover_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  
  -- Imagem padrão para ambientes sem configuração específica
  default_environment_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.proposal_template_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own template settings"
  ON public.proposal_template_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger de updated_at
CREATE TRIGGER update_proposal_template_settings_updated_at
  BEFORE UPDATE ON public.proposal_template_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de mapeamentos de ambiente
CREATE TABLE IF NOT EXISTS public.asset_environment_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  
  -- Padrão de nome do ambiente (ex: "Sala", "Cozinha", "Quarto")
  environment_name_pattern TEXT NOT NULL,
  
  -- Prioridade (caso múltiplos padrões correspondam)
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, environment_name_pattern)
);

-- RLS
ALTER TABLE public.asset_environment_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own mappings"
  ON public.asset_environment_mappings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para busca rápida
CREATE INDEX idx_asset_env_mappings_user_pattern 
  ON public.asset_environment_mappings(user_id, environment_name_pattern);

-- Trigger de updated_at
CREATE TRIGGER update_asset_environment_mappings_updated_at
  BEFORE UPDATE ON public.asset_environment_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo is_default na tabela assets
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.assets.is_default IS 'Marca se este asset é a imagem padrão para ambientes';