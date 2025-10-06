import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProposalTemplateSettings, AssetEnvironmentMapping, Asset } from '@/types/assetLibrary';
import { useToast } from '@/hooks/use-toast';

export const useProposalTemplates = () => {
  const [settings, setSettings] = useState<ProposalTemplateSettings | null>(null);
  const [mappings, setMappings] = useState<AssetEnvironmentMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('proposal_template_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar configurações',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadMappings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('asset_environment_mappings')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (error) throw error;
      setMappings(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mapeamentos',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const saveMainCover = async (assetId: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('proposal_template_settings')
        .upsert({
          user_id: user.id,
          main_cover_asset_id: assetId
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Capa salva',
        description: 'Imagem de capa principal atualizada com sucesso'
      });

      await loadSettings();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar capa',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const createMapping = async (assetId: string, pattern: string, priority: number = 0) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('asset_environment_mappings')
        .insert({
          user_id: user.id,
          asset_id: assetId,
          environment_name_pattern: pattern,
          priority
        });

      if (error) throw error;

      toast({
        title: 'Mapeamento criado',
        description: `Ambiente "${pattern}" vinculado à imagem`
      });

      await loadMappings();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar mapeamento',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deleteMapping = async (mappingId: string) => {
    try {
      const { error } = await supabase
        .from('asset_environment_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;

      toast({
        title: 'Mapeamento removido',
        description: 'Vínculo entre ambiente e imagem foi removido'
      });

      await loadMappings();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover mapeamento',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const setDefaultAsset = async (assetId: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Primeiro, remover o is_default de todos os assets do usuário
      await supabase
        .from('assets')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Depois, marcar o novo asset como padrão (se houver)
      if (assetId) {
        const { error } = await supabase
          .from('assets')
          .update({ is_default: true })
          .eq('id', assetId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Atualizar settings
      const { error: settingsError } = await supabase
        .from('proposal_template_settings')
        .upsert({
          user_id: user.id,
          default_environment_asset_id: assetId
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) throw settingsError;

      toast({
        title: 'Imagem padrão definida',
        description: assetId ? 'Imagem padrão atualizada' : 'Imagem padrão removida'
      });

      await loadSettings();
    } catch (error: any) {
      toast({
        title: 'Erro ao definir imagem padrão',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getDefaultAsset = async (): Promise<Asset | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  };

  return {
    settings,
    mappings,
    loading,
    loadSettings,
    loadMappings,
    saveMainCover,
    createMapping,
    deleteMapping,
    setDefaultAsset,
    getDefaultAsset
  };
};
