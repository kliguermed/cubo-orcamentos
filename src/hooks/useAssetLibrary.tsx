import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Asset, AssetFilters } from '@/types/assetLibrary';
import { useToast } from '@/hooks/use-toast';

export const useAssetLibrary = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch assets com filtros
  const fetchAssets = useCallback(async (filters?: AssetFilters) => {
    setLoading(true);
    try {
      let query = supabase.from('assets').select('*');
      
      if (filters?.categories?.length) {
        query = query.overlaps('categories', filters.categories);
      }
      
      if (filters?.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }
      
      if (filters?.search) {
        query = query.or(`tags.cs.{${filters.search}},copyright_info.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setAssets(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar imagens',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Upload com deduplicação via checksum
  const uploadAsset = async (file: File, metadata: Partial<Asset>) => {
    try {
      // Validar tipo
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        throw new Error('Formato não suportado. Use PNG, JPG ou WEBP.');
      }
      
      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB.');
      }
      
      // Calcular checksum (SHA256)
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('assets')
        .select('id, url')
        .eq('checksum', checksum)
        .single();
      
      if (existing) {
        toast({
          title: 'Imagem já existe',
          description: 'Esta imagem já foi adicionada à biblioteca.',
          variant: 'default'
        });
        return { id: existing.id, url: existing.url };
      }
      
      // Upload para Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);
      
      // Obter dimensões da imagem
      const img = new Image();
      const imgLoadPromise = new Promise<{width: number, height: number}>((resolve) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = publicUrl;
      });
      const { width, height } = await imgLoadPromise;
      
      // Criar registro
      const { data, error } = await supabase
        .from('assets')
        .insert([{
          url: publicUrl,
          mime_type: file.type,
          checksum,
          width,
          height,
          categories: metadata.categories || [],
          tags: metadata.tags || [],
          copyright_info: metadata.copyright_info,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Imagem adicionada',
        description: 'Imagem enviada com sucesso!'
      });
      
      return { id: data.id, url: data.url };
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);
      
      if (error) throw error;
      
      setAssets(prev => prev.filter(a => a.id !== assetId));
      
      toast({
        title: 'Imagem removida',
        description: 'A imagem foi excluída da biblioteca.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return {
    assets,
    loading,
    fetchAssets,
    uploadAsset,
    deleteAsset
  };
};
