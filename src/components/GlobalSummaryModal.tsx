import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface GlobalSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculateGlobalTotals: () => Promise<any>;
}

export const GlobalSummaryModal = ({ open, onOpenChange, calculateGlobalTotals }: GlobalSummaryModalProps) => {
  const [globalData, setGlobalData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadGlobalData();
    }
  }, [open]);

  const loadGlobalData = async () => {
    setLoading(true);
    try {
      const data = await calculateGlobalTotals();
      setGlobalData(data);
    } catch (error) {
      console.error("Erro ao carregar dados globais:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resumo Global do Projeto</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : globalData ? (
          <div className="space-y-6">
            {/* All Items Table */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Todos os Itens do Projeto</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-20">Qtd</TableHead>
                    <TableHead className="w-32">Preço Compra</TableHead>
                    <TableHead className="w-32">Preço Venda</TableHead>
                    <TableHead className="w-32">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalData.allItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="secondary">{item.environments?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.purchase_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.sale_price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.subtotal || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Global Summary */}
            <div className="p-6 bg-muted/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-6 text-center">Resumo Global do Projeto</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Valor de Compra</div>
                  <div className="text-2xl font-semibold">{formatCurrency(globalData.purchaseTotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Mão de Obra</div>
                  <div className="text-2xl font-semibold text-blue-600">{formatCurrency(globalData.laborTotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">RT Total</div>
                  <div className="text-2xl font-semibold text-green-600">{formatCurrency(globalData.rtTotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Custo Total</div>
                  <div className="text-2xl font-semibold text-orange-600">{formatCurrency(globalData.costTotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Lucro Total</div>
                  <div className="text-2xl font-semibold text-purple-600">{formatCurrency(globalData.profitTotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total Final</div>
                  <div className="text-3xl font-bold text-primary">{formatCurrency(globalData.finalTotal)}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Erro ao carregar dados do projeto</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};