import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Image, Trash2, Plus, Eye } from 'lucide-react';
import { useProposalTemplates } from '@/hooks/useProposalTemplates';
import { ImagePicker } from '@/components/AssetLibrary/ImagePicker';
import { supabase } from '@/integrations/supabase/client';
import { Asset } from '@/types/assetLibrary';
import { useNavigate } from 'react-router-dom';

export const ProposalFormattingTab = () => {
  const navigate = useNavigate();
  const {
    settings,
    mappings,
    loading,
    loadSettings,
    loadMappings,
    saveMainCover,
    createMapping,
    deleteMapping,
  } = useProposalTemplates();

  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [mappingPickerOpen, setMappingPickerOpen] = useState(false);
  const [mainCoverAsset, setMainCoverAsset] = useState<Asset | null>(null);
  const [defaultAsset, setDefaultAsset] = useState<Asset | null>(null);
  const [newMappingPattern, setNewMappingPattern] = useState('');
  const [selectedMappingAssetId, setSelectedMappingAssetId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadMappings();
  }, [loadSettings, loadMappings]);

  useEffect(() => {
    if (settings?.main_cover_asset_id) {
      loadAsset(settings.main_cover_asset_id, setMainCoverAsset);
    }
    if (settings?.default_environment_asset_id) {
      loadAsset(settings.default_environment_asset_id, setDefaultAsset);
    }
  }, [settings]);

  const loadAsset = async (assetId: string, setter: (asset: Asset | null) => void) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .maybeSingle();

      if (error) throw error;
      setter(data);
    } catch (error) {
      console.error('Erro ao carregar asset:', error);
    }
  };

  const handleMainCoverSelect = async (assetId: string, assetUrl: string) => {
    await saveMainCover(assetId);
  };

  const handleMappingAssetSelect = async (assetId: string, assetUrl: string) => {
    if (!newMappingPattern.trim()) {
      return;
    }

    await createMapping(assetId, newMappingPattern.trim());
    setNewMappingPattern('');
    setSelectedMappingAssetId(null);
  };

  const getMappingAssetUrl = (assetId: string): string | null => {
    const mapping = mappings.find(m => m.asset_id === assetId);
    return mapping ? assetId : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Capa Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Capa Principal da Proposta</CardTitle>
          <CardDescription>
            Defina a imagem de capa que aparecerá na primeira página de todas as propostas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mainCoverAsset ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                <img
                  src={mainCoverAsset.url}
                  alt="Capa principal"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setImagePickerOpen(true)} variant="outline">
                  <Image className="h-4 w-4 mr-2" />
                  Alterar Capa
                </Button>
                <Button onClick={() => saveMainCover(null)} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed bg-muted/30">
                <ImageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Nenhuma capa definida</p>
                <Button onClick={() => setImagePickerOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Escolher Capa
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapeamentos de Ambientes */}
      <Card>
        <CardHeader>
          <CardTitle>Vincular Imagens aos Ambientes</CardTitle>
          <CardDescription>
            Configure quais imagens devem ser usadas automaticamente para cada tipo de ambiente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de mapeamentos existentes */}
          {mappings.length > 0 && (
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{mapping.environment_name_pattern}</p>
                      <p className="text-xs text-muted-foreground">
                        Prioridade: {mapping.priority}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMapping(mapping.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar novo mapeamento */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Adicionar Novo Vínculo</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Sala, Cozinha, Quarto..."
                value={newMappingPattern}
                onChange={(e) => setNewMappingPattern(e.target.value)}
              />
              <Button
                onClick={() => setMappingPickerOpen(true)}
                disabled={!newMappingPattern.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Vincular Imagem
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imagem Padrão */}
      <Card>
        <CardHeader>
          <CardTitle>Imagem Padrão para Ambientes</CardTitle>
          <CardDescription>
            Esta imagem será usada quando um ambiente não tiver uma imagem vinculada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {defaultAsset ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="relative w-24 h-24 rounded overflow-hidden border">
                <img
                  src={defaultAsset.url}
                  alt="Imagem padrão"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">Imagem padrão configurada</p>
                <p className="text-sm text-muted-foreground">
                  Será usada quando não houver vínculo específico
                </p>
              </div>
              <Badge variant="secondary">Padrão</Badge>
            </div>
          ) : (
            <div className="text-center p-6 rounded-lg border-2 border-dashed bg-muted/30">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-2">
                Nenhuma imagem padrão definida
              </p>
              <p className="text-xs text-muted-foreground">
                Marque uma imagem como padrão na biblioteca de imagens
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visualizar Proposta */}
      <Card>
        <CardHeader>
          <CardTitle>Visualizar Formatação</CardTitle>
          <CardDescription>
            Veja como sua proposta ficará com as configurações atuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/proposal-preview')} size="lg" className="w-full">
            <Eye className="h-5 w-5 mr-2" />
            Visualizar Proposta de Exemplo
          </Button>
        </CardContent>
      </Card>

      {/* Image Pickers */}
      <ImagePicker
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={handleMainCoverSelect}
        selectedAssetId={settings?.main_cover_asset_id}
      />

      <ImagePicker
        open={mappingPickerOpen}
        onOpenChange={setMappingPickerOpen}
        onSelect={handleMappingAssetSelect}
        selectedAssetId={selectedMappingAssetId || undefined}
      />
    </div>
  );
};
