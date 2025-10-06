import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit2, ImageIcon } from 'lucide-react';
import { ImagePicker } from '@/components/AssetLibrary/ImagePicker';

interface Environment {
  id: string;
  name: string;
  cover_image_url?: string;
}

interface ProposalEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environments: Environment[];
  onUpdateEnvironmentCover: (envId: string, coverUrl: string) => Promise<void>;
}

export const ProposalEditorModal = ({
  open,
  onOpenChange,
  environments,
  onUpdateEnvironmentCover
}: ProposalEditorModalProps) => {
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  
  const handleSelectImage = async (assetId: string, assetUrl: string) => {
    if (!editingEnvId) return;
    
    await onUpdateEnvironmentCover(editingEnvId, assetUrl);
    setEditingEnvId(null);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Formatar Proposta - Capas dos Ambientes</DialogTitle>
            <DialogDescription>
              Escolha imagens personalizadas para cada ambiente da proposta
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {environments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum ambiente cadastrado</p>
                <p className="text-sm">Adicione ambientes ao orçamento primeiro</p>
              </div>
            ) : (
              environments.map(env => (
                <div
                  key={env.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors"
                >
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
              ))
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
