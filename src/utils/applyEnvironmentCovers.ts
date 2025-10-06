import { supabase } from '@/integrations/supabase/client';

/**
 * Aplica automaticamente as capas de ambiente baseado nos mapeamentos configurados
 * ou na imagem padrão se nenhum mapeamento corresponder
 */
export const applyEnvironmentCovers = async (budgetId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar todos os ambientes do orçamento que não têm capa
    const { data: environments, error: envError } = await supabase
      .from('environments')
      .select('id, name, cover_image_url')
      .eq('budget_id', budgetId)
      .is('cover_image_url', null);

    if (envError) throw envError;
    if (!environments || environments.length === 0) return;

    // Buscar mapeamentos do usuário
    const { data: mappings, error: mappingsError } = await supabase
      .from('asset_environment_mappings')
      .select('*, assets!inner(url)')
      .eq('user_id', user.id)
      .order('priority', { ascending: false });

    if (mappingsError) throw mappingsError;

    // Buscar imagem padrão
    const { data: defaultAsset } = await supabase
      .from('assets')
      .select('url')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle();

    // Para cada ambiente, tentar encontrar uma imagem
    const updates = environments.map(async (env) => {
      let coverUrl: string | null = null;

      // Tentar encontrar um mapeamento que corresponda ao nome do ambiente
      if (mappings && mappings.length > 0) {
        const matchingMapping = mappings.find(mapping => {
          const pattern = mapping.environment_name_pattern.toLowerCase();
          const envName = env.name.toLowerCase();
          return envName.includes(pattern) || pattern.includes(envName);
        });

        if (matchingMapping && matchingMapping.assets) {
          coverUrl = (matchingMapping.assets as any).url;
        }
      }

      // Se não encontrou mapeamento, usar imagem padrão
      if (!coverUrl && defaultAsset) {
        coverUrl = defaultAsset.url;
      }

      // Atualizar ambiente se encontrou uma imagem
      if (coverUrl) {
        return supabase
          .from('environments')
          .update({ cover_image_url: coverUrl })
          .eq('id', env.id);
      }

      return null;
    });

    // Executar todas as atualizações
    await Promise.all(updates.filter(u => u !== null));

    console.log(`Aplicadas capas automáticas para ${environments.length} ambientes`);
  } catch (error) {
    console.error('Erro ao aplicar capas de ambiente:', error);
  }
};
