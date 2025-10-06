-- Adicionar campos à tabela environment_templates para biblioteca de imagens
ALTER TABLE environment_templates
ADD COLUMN image_library JSONB DEFAULT '[]'::jsonb,
ADD COLUMN default_image_url TEXT;

-- Adicionar campo à tabela environments para vincular ao template usado
ALTER TABLE environments
ADD COLUMN template_id UUID REFERENCES environment_templates(id) ON DELETE SET NULL;

-- Comentários para documentação
COMMENT ON COLUMN environment_templates.image_library IS 'Array de objetos com id, url, is_default (máximo 4 imagens)';
COMMENT ON COLUMN environment_templates.default_image_url IS 'URL da imagem padrão selecionada da biblioteca';
COMMENT ON COLUMN environments.template_id IS 'Referência ao template de ambiente usado na criação';