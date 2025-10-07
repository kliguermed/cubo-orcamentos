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
import { EnvironmentSelector } from './EnvironmentSelector';
import { EnvironmentTemplate } from '@/types/assetLibrary';

interface AddEnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: EnvironmentTemplate[];
  onAddEnvironment: (templateName: string, templateId?: string) => void;
  onCreateStandard: (name: string) => void;
  onCreateTemporary: (name: string) => void;
}

export function AddEnvironmentDialog({
  open,
  onOpenChange,
  templates,
  onAddEnvironment,
  onCreateStandard,
  onCreateTemporary
}: AddEnvironmentDialogProps) {
  const [selectedEnvName, setSelectedEnvName] = useState('');

  const handleAddToProposal = () => {
    if (!selectedEnvName) return;
    
    // Check if it's an existing template
    const existingTemplate = templates.find(t => t.name === selectedEnvName);
    
    if (existingTemplate) {
      onAddEnvironment(selectedEnvName, existingTemplate.id);
    } else {
      // This shouldn't happen as we call onCreateStandard/onCreateTemporary instead
      onAddEnvironment(selectedEnvName);
    }
    
    setSelectedEnvName('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedEnvName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Ambiente ao Orçamento</DialogTitle>
          <DialogDescription>
            Selecione um ambiente da lista ou crie um novo
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <EnvironmentSelector
            templates={templates}
            value={selectedEnvName}
            onChange={setSelectedEnvName}
            onCreateStandard={(name) => {
              setSelectedEnvName('');
              onOpenChange(false);
              onCreateStandard(name);
            }}
            onCreateTemporary={(name) => {
              setSelectedEnvName('');
              onOpenChange(false);
              onCreateTemporary(name);
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAddToProposal}
            disabled={!selectedEnvName}
          >
            Adicionar ao Orçamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
