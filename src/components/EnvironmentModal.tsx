import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface Environment {
  id: string;
  name: string;
  description: string;
  image_url: string;
  subtotal: number;
}

interface EnvironmentModalProps {
  environment: Environment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (environment: Environment) => Promise<void>;
  onDelete?: (environmentId: string) => Promise<void>;
}

export const EnvironmentModal = ({
  environment,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: EnvironmentModalProps) => {
  const [name, setName] = useState(environment?.name || "");
  const [description, setDescription] = useState(environment?.description || "");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();

  const handleSave = async () => {
    if (!environment || !name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        ...environment,
        name: name.trim(),
        description: description.trim(),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!environment || !onDelete) return;
    
    await onDelete(environment.id);
    setShowDeleteAlert(false);
    onOpenChange(false);
  };

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && environment) {
      setName(environment.name);
      setDescription(environment.description);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={isMobile ? "max-w-[95vw] p-4" : "sm:max-w-md"}>
          <DialogHeader>
            <DialogTitle>Editar Ambiente</DialogTitle>
            <DialogDescription>
              Altere o nome e descrição do ambiente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="env-name">Nome do ambiente *</Label>
              <Input
                id="env-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sala de estar"
              />
            </div>
            <div>
              <Label htmlFor="env-description">Descrição</Label>
              <Textarea
                id="env-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva os detalhes do ambiente..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className={isMobile ? "flex-col gap-2" : "gap-2"}>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
                className={isMobile ? "w-full order-last" : "mr-auto"}
                size={isMobile ? "sm" : "default"}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className={isMobile ? "w-full" : ""}
              size={isMobile ? "sm" : "default"}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className={isMobile ? "w-full" : ""}
              size={isMobile ? "sm" : "default"}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ambiente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este ambiente? Esta ação não pode ser desfeita
              e todos os itens do ambiente também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};