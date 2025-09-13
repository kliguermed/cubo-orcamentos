import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Item {
  id?: string;
  environment_id: string;
  name: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  subtotal: number;
}

interface ItemModalProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<Item, 'id'>) => Promise<void>;
  environmentId: string;
  settings?: any;
}

export const ItemModal = ({
  item,
  open,
  onOpenChange,
  onSave,
  environmentId,
  settings,
}: ItemModalProps) => {
  const [name, setName] = useState(item?.name || "");
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [purchasePrice, setPurchasePrice] = useState(item?.purchase_price || 0);
  const [saving, setSaving] = useState(false);

  const calculateSalePrice = () => {
    if (!settings?.markup_percentage) return purchasePrice;
    return purchasePrice * (1 + settings.markup_percentage / 100);
  };

  const calculateSubtotal = () => {
    return quantity * calculateSalePrice();
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        environment_id: environmentId,
        name: name.trim(),
        quantity,
        purchase_price: purchasePrice,
        sale_price: calculateSalePrice(),
        subtotal: calculateSubtotal(),
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setQuantity(1);
    setPurchasePrice(0);
  };

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && item) {
      setName(item.name);
      setQuantity(item.quantity);
      setPurchasePrice(item.purchase_price);
    } else if (newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const isValid = name.trim().length > 0 && quantity > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Item" : "Adicionar Item"}
          </DialogTitle>
          <DialogDescription>
            {item 
              ? "Altere os dados do item" 
              : "Preencha os dados do novo item"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="item-name">Nome do item *</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tinta acrílica"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item-quantity">Quantidade *</Label>
              <Input
                id="item-quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div>
              <Label htmlFor="item-purchase-price">Preço de compra</Label>
              <Input
                id="item-purchase-price"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="item-sale-price">Preço de venda (calculado automaticamente)</Label>
            <Input
              id="item-sale-price"
              type="number"
              step="0.01"
              min="0"
              value={calculateSalePrice()}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-medium">Subtotal:</span>
              <span className="font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(calculateSubtotal())}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};