import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit2, ImageIcon, Eye, ArrowLeft } from 'lucide-react';
import { ImagePicker } from '@/components/AssetLibrary/ImagePicker';

interface Environment {
  id: string;
  name: string;
  cover_image_url?: string;
  template_id?: string;
}

interface EnvironmentImage {
  id: string;
  url: string;
  is_default: boolean;
}

interface ProposalEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environments: Environment[];
  onUpdateEnvironmentCover: (envId: string, coverUrl: string) => Promise<void>;
  budgetId: string;
  environmentTemplateImages?: { [templateId: string]: EnvironmentImage[] };
}

export const ProposalEditorModal = ({
  open,
  onOpenChange,
  environments,
  onUpdateEnvironmentCover,
  budgetId,
  environmentTemplateImages = {}
}: ProposalEditorModalProps) => {
  const navigate = useNavigate();
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  
  const handleSelectImage = async (assetId: string, assetUrl: string) => {
    if (!editingEnvId) return;
    
    await onUpdateEnvironmentCover(editingEnvId, assetUrl);
    setEditingEnvId(null);
  };

  const handlePreview = () => {
    navigate(`/proposal-preview?budgetId=${budgetId}`);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>Formatar Proposta - Capas dos Ambientes</DialogTitle>
              <DialogDescription>
                Escolha imagens personalizadas para cada ambiente da proposta
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Preview
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {environments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum ambiente cadastrado</p>
                <p className="text-sm">Adicione ambientes ao orçamento primeiro</p>
              </div>
            ) : (
              environments.map(env => {
                const templateImages = env.template_id ? environmentTemplateImages[env.template_id] : [];
                
                return (
                  <div
                    key={env.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Preview da capa */}
                      <div className="relative w-32 h-32 rounded overflow-hidden bg-muted flex-shrink-0">
                        {env.cover_image_url ? (
                          <img
                            src={env.cover_image_url}
                            alt={env.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      
                      {/* Nome do ambiente */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{env.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {env.cover_image_url ? 'Capa personalizada' : 'Sem capa - usando padrão'}
                        </p>
                      </div>
                      
                      {/* Botão de editar */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingEnvId(env.id);
                          setPickerOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Escolher Capa
                      </Button>
                    </div>

                    {/* Biblioteca de imagens do template */}
                    {templateImages && templateImages.length > 0 && (
                      <div className="border-t bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground mb-2">
                          Imagens disponíveis para este ambiente:
                        </p>
                        <div className="flex gap-2">
                          {templateImages.map((img) => (
                            <button
                              key={img.id}
                              onClick={async () => {
                                await onUpdateEnvironmentCover(env.id, img.url);
                              }}
                              className="relative w-20 h-20 rounded overflow-hidden border-2 hover:border-primary transition-colors"
                            >
                              <img
                                src={img.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {img.is_default && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-1 py-0.5">
                                  Padrão
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* ImagePicker */}
      <ImagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelectImage}
        selectedAssetId={
          editingEnvId 
            ? environments.find(e => e.id === editingEnvId)?.cover_image_url 
            : undefined
        }
      />
    </>
  );
};
