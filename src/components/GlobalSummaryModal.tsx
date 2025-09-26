import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface GlobalSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculateGlobalTotals: () => Promise<any>;
}

export const GlobalSummaryModal = ({ open, onOpenChange, calculateGlobalTotals }: GlobalSummaryModalProps) => {
  const [globalData, setGlobalData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

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
      <DialogContent className={isMobile ? "max-w-[95vw] max-h-[90vh] overflow-y-auto p-3" : "max-w-6xl max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle>Resumo Global do Projeto</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : globalData ? (
          <div className={isMobile ? "space-y-4" : "space-y-6"}>
            {/* All Items Table */}
            <div>
              <h3 className={isMobile ? "text-base font-semibold mb-3" : "text-lg font-semibold mb-4"}>Todos os Itens do Projeto</h3>
              {isMobile ? (
                <div className="space-y-2">
                  {globalData.allItems.map((item: any) => (
                    <Card key={item.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="text-xs">{item.environments?.name || 'N/A'}</Badge>
                          <div className="text-xs font-bold text-primary">{formatCurrency(item.subtotal || 0)}</div>
                        </div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">Qtd</div>
                            <div className="font-medium">{item.quantity}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Compra</div>
                            <div className="font-medium">{formatCurrency(item.purchase_price)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Venda</div>
                            <div className="font-medium">{formatCurrency(item.sale_price)}</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
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
              )}
            </div>

            {/* Global Summary */}
            <div className={isMobile ? "p-3 bg-muted/50 rounded-lg" : "p-6 bg-muted/50 rounded-lg"}>
              <h3 className={isMobile ? "text-base font-semibold mb-4 text-center" : "text-xl font-semibold mb-6 text-center"}>Resumo Global do Projeto</h3>
              <div className={isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 md:grid-cols-3 gap-6"}>
                <div className="text-center">
                  <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Valor de Compra</div>
                  <div className={isMobile ? "text-sm font-semibold" : "text-2xl font-semibold"}>{formatCurrency(globalData.purchaseTotal)}</div>
                </div>
                <div className="text-center">
                  <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Mão de Obra</div>
                  <div className={isMobile ? "text-sm font-semibold text-blue-600" : "text-2xl font-semibold text-blue-600"}>{formatCurrency(globalData.laborTotal)}</div>
                </div>
                <div className="text-center">
                  <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>RT Total</div>
                  <div className={isMobile ? "text-sm font-semibold text-green-600" : "text-2xl font-semibold text-green-600"}>{formatCurrency(globalData.rtTotal)}</div>
                </div>
                <div className="text-center">
                  <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Custo Total</div>
                  <div className={isMobile ? "text-sm font-semibold text-orange-600" : "text-2xl font-semibold text-orange-600"}>{formatCurrency(globalData.costTotal)}</div>
                </div>
                <div className="text-center">
                  <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Lucro Total</div>
                  <div className={isMobile ? "text-sm font-semibold text-purple-600" : "text-2xl font-semibold text-purple-600"}>{formatCurrency(globalData.profitTotal)}</div>
                </div>
                <div className="text-center">
                  <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Total Final</div>
                  <div className={isMobile ? "text-lg font-bold text-primary" : "text-3xl font-bold text-primary"}>{formatCurrency(globalData.finalTotal)}</div>
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