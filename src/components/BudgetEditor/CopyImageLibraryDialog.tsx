import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EnvironmentTemplate } from '@/types/assetLibrary';
import { ImageIcon } from 'lucide-react';

interface CopyImageLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: EnvironmentTemplate[];
  newEnvironmentName: string;
  onConfirm: (sourceTemplateId: string | null) => void;
}

export function CopyImageLibraryDialog({
  open,
  onOpenChange,
  templates,
  newEnvironmentName,
  onConfirm
}: CopyImageLibraryDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const handleConfirm = () => {
    onConfirm(selectedTemplateId || null);
    setSelectedTemplateId('');
  };

  const templatesWithImages = templates.filter(t => t.image_library?.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Ambiente Padrão</DialogTitle>
          <DialogDescription>
            O ambiente "{newEnvironmentName}" será adicionado aos seus templates.
            Deseja copiar a biblioteca de imagens de outro ambiente?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Copiar imagens de (opcional)</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Não copiar imagens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não copiar imagens</SelectItem>
                {templatesWithImages.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({template.image_library.length} {template.image_library.length === 1 ? 'imagem' : 'imagens'})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Criar Ambiente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
