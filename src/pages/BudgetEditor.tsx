import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Save, Trash2, Upload, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnvironmentModal } from "@/components/EnvironmentModal";
import { ItemModal } from "@/components/ItemModal";

interface Budget {
  id: string;
  protocol_number: number;
  client_name: string;
  client_cpf_cnpj: string;
  client_phone: string;
  client_email: string;
  status: "editing" | "finished";
  total_amount: number;
}

interface Environment {
  id: string;
  name: string;
  description: string;
  image_url: string;
  subtotal: number;
}

interface Item {
  id: string;
  environment_id: string;
  name: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  subtotal: number;
}

const BudgetEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [environmentModalOpen, setEnvironmentModalOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    if (id) {
      fetchBudgetData();
    }
  }, [id]);

  useEffect(() => {
    if (selectedEnvId) {
      fetchItems(selectedEnvId);
    }
  }, [selectedEnvId]);

  const fetchBudgetData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [budgetRes, envRes, settingsRes] = await Promise.all([
        supabase.from("budgets").select("*").eq("id", id).single(),
        supabase.from("environments").select("*").eq("budget_id", id),
        supabase.from("settings").select("*").eq("user_id", user?.id).maybeSingle()
      ]);

      if (budgetRes.error) throw budgetRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setBudget(budgetRes.data as Budget);
      setEnvironments(envRes.data || []);
      setSettings(settingsRes.data || {
        labor_type: "percentage",
        labor_value: 0,
        rt_type: "percentage",
        rt_value: 0,
        markup_percentage: 0,
        rt_distribution: "diluted"
      });
      
      if (envRes.data && envRes.data.length > 0) {
        setSelectedEnvId(envRes.data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar orçamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (envId: string) => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("environment_id", envId);

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar itens",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addEnvironment = async () => {
    try {
      const { data, error } = await supabase
        .from("environments")
        .insert([
          {
            budget_id: id,
            name: "Novo Ambiente",
            description: "",
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setEnvironments(prev => [...prev, data]);
      setSelectedEnvId(data.id);
      
      toast({
        title: "Ambiente adicionado",
        description: "Novo ambiente criado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar ambiente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addItem = async () => {
    if (!selectedEnvId) return;

    try {
      const { data, error } = await supabase
        .from("items")
        .insert([
          {
            environment_id: selectedEnvId,
            name: "Novo Item",
            quantity: 1,
            purchase_price: 0,
            sale_price: 0,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data]);
      
      toast({
        title: "Item adicionado",
        description: "Novo item criado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateSalePrice = (purchasePrice: number, quantity: number = 1) => {
    if (!settings) return purchasePrice;
    
    let salePrice = purchasePrice;
    
    // Apply markup
    if (settings.markup_percentage > 0) {
      salePrice = salePrice * (1 + settings.markup_percentage / 100);
    }
    
    // Apply labor
    if (settings.labor_type === "percentage" && settings.labor_value > 0) {
      salePrice = salePrice * (1 + settings.labor_value / 100);
    } else if (settings.labor_type === "fixed" && settings.labor_value > 0) {
      // Add fixed labor value divided by quantity
      salePrice = salePrice + (settings.labor_value / quantity);
    }
    
    // Apply RT (if percentage and diluted)
    if (settings.rt_type === "percentage" && settings.rt_distribution === "diluted" && settings.rt_value > 0) {
      salePrice = salePrice * (1 + settings.rt_value / 100);
    } else if (settings.rt_type === "fixed" && settings.rt_distribution === "diluted" && settings.rt_value > 0) {
      // Add fixed RT value divided by quantity
      salePrice = salePrice + (settings.rt_value / quantity);
    }
    
    return salePrice;
  };

  const updateItem = async (itemId: string, field: string, value: any) => {
    try {
      const currentItem = items.find(item => item.id === itemId);
      if (!currentItem) return;
      
      let updateData: any = { [field]: value };
      
      // Auto-calculate sale price when purchase price or quantity changes
      if (field === "purchase_price" || field === "quantity") {
        const newQuantity = field === "quantity" ? (parseFloat(value) || 0) : currentItem.quantity;
        const newPurchasePrice = field === "purchase_price" ? (parseFloat(value) || 0) : currentItem.purchase_price;
        updateData.sale_price = calculateSalePrice(newPurchasePrice, newQuantity);
      }

      // Calculate subtotal
      const finalQuantity = updateData.quantity || currentItem.quantity;
      const finalSalePrice = updateData.sale_price || currentItem.sale_price;
      updateData.subtotal = finalQuantity * finalSalePrice;

      const { error } = await supabase
        .from("items")
        .update(updateData)
        .eq("id", itemId);

      if (error) throw error;

      setItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, ...updateData }
            : item
        )
      );

      // Update environment subtotal
      await updateEnvironmentSubtotal();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));
      await updateEnvironmentSubtotal();
      
      toast({
        title: "Item removido",
        description: "Item foi removido com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateEnvironmentSubtotal = async () => {
    if (!selectedEnvId) return;
    
    const currentItems = items.filter(item => item.environment_id === selectedEnvId);
    const subtotal = currentItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    
    try {
      const { error } = await supabase
        .from("environments")
        .update({ subtotal })
        .eq("id", selectedEnvId);

      if (error) throw error;

      setEnvironments(prev => 
        prev.map(env => 
          env.id === selectedEnvId 
            ? { ...env, subtotal }
            : env
        )
      );
    } catch (error: any) {
      console.error("Erro ao atualizar subtotal do ambiente:", error);
    }
  };

  const saveBudgetClient = async () => {
    if (!budget) return;
    
    try {
      const { error } = await supabase
        .from("budgets")
        .update({
          client_name: budget.client_name,
          client_cpf_cnpj: budget.client_cpf_cnpj,
          client_phone: budget.client_phone,
          client_email: budget.client_email,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Dados salvos",
        description: "Dados do cliente atualizados com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveEnvironment = async (environment: Environment) => {
    try {
      const { error } = await supabase
        .from("environments")
        .update({
          name: environment.name,
          description: environment.description,
        })
        .eq("id", environment.id);

      if (error) throw error;

      setEnvironments(prev => 
        prev.map(env => 
          env.id === environment.id 
            ? { ...env, name: environment.name, description: environment.description }
            : env
        )
      );

      toast({
        title: "Ambiente atualizado",
        description: "Dados do ambiente salvos com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar ambiente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteEnvironment = async (environmentId: string) => {
    try {
      const { error } = await supabase
        .from("environments")
        .delete()
        .eq("id", environmentId);

      if (error) throw error;

      setEnvironments(prev => prev.filter(env => env.id !== environmentId));
      
      if (selectedEnvId === environmentId) {
        setSelectedEnvId(null);
        setItems([]);
      }

      toast({
        title: "Ambiente removido",
        description: "Ambiente foi removido com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover ambiente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveItem = async (itemData: Omit<Item, 'id'>) => {
    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;

        setItems(prev => 
          prev.map(item => 
            item.id === editingItem.id 
              ? { ...item, ...itemData }
              : item
          )
        );

        toast({
          title: "Item atualizado",
          description: "Item foi atualizado com sucesso",
        });
      } else {
        // Create new item
        const { data, error } = await supabase
          .from("items")
          .insert([itemData])
          .select()
          .single();

        if (error) throw error;

        setItems(prev => [...prev, data]);

        toast({
          title: "Item adicionado",
          description: "Novo item foi adicionado com sucesso",
        });
      }

      await updateEnvironmentSubtotal();
      setEditingItem(null);
    } catch (error: any) {
      toast({
        title: editingItem ? "Erro ao atualizar item" : "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEnvironmentModal = (environment: Environment) => {
    setEditingEnvironment(environment);
    setEnvironmentModalOpen(true);
  };

  const openItemModal = (item?: Item) => {
    setEditingItem(item || null);
    setItemModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Orçamento não encontrado</h2>
          <Button onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const selectedEnvironment = environments.find(env => env.id === selectedEnvId);
  const itemsTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold">Orçamento #{budget.protocol_number}</h1>
            <p className="text-sm text-muted-foreground">{budget.client_name}</p>
          </div>
          <div className="ml-auto">
            <Badge variant={budget.status === "finished" ? "default" : "secondary"}>
              {budget.status === "finished" ? "Finalizado" : "Em edição"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Client & Environments */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div>
                   <Label htmlFor="client-name">Nome completo</Label>
                   <Input
                     id="client-name"
                     value={budget.client_name}
                     onChange={(e) => setBudget(prev => prev ? { ...prev, client_name: e.target.value } : null)}
                     onFocus={(e) => {
                       if (e.target.value === "Nome do cliente") {
                         setBudget(prev => prev ? { ...prev, client_name: "" } : null);
                       }
                       e.target.select();
                     }}
                     placeholder="Digite o nome do cliente"
                   />
                 </div>
                <div>
                  <Label htmlFor="client-cpf">CPF/CNPJ</Label>
                  <Input
                    id="client-cpf"
                    value={budget.client_cpf_cnpj || ""}
                    onChange={(e) => setBudget(prev => prev ? { ...prev, client_cpf_cnpj: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="client-phone">Telefone</Label>
                  <Input
                    id="client-phone"
                    value={budget.client_phone || ""}
                    onChange={(e) => setBudget(prev => prev ? { ...prev, client_phone: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="client-email">E-mail</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={budget.client_email || ""}
                    onChange={(e) => setBudget(prev => prev ? { ...prev, client_email: e.target.value } : null)}
                  />
                 </div>
                 <div className="pt-4">
                   <Button onClick={saveBudgetClient} className="w-full">
                     <Save className="h-4 w-4 mr-2" />
                     Salvar dados do cliente
                   </Button>
                 </div>
               </CardContent>
             </Card>

            {/* Environments */}
            <Card>
              <CardHeader>
                <CardTitle>Ambientes</CardTitle>
                <CardDescription>Organize o orçamento por ambientes</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-2 mb-4">
                   {environments.map((env) => (
                     <div
                       key={env.id}
                       className={`p-3 border rounded-md cursor-pointer transition-colors ${
                         selectedEnvId === env.id ? "bg-accent" : "hover:bg-accent/50"
                       }`}
                       onClick={() => setSelectedEnvId(env.id)}
                     >
                       <div className="flex justify-between items-center">
                         <div>
                           <div className="font-medium">{env.name}</div>
                           <div className="text-sm text-muted-foreground">
                             {formatCurrency(env.subtotal)}
                           </div>
                         </div>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={(e) => {
                             e.stopPropagation();
                             openEnvironmentModal(env);
                           }}
                         >
                           <Edit2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
                <Button onClick={addEnvironment} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Ambiente
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Items */}
          <div className="lg:col-span-2">
            {selectedEnvironment ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedEnvironment.name}</CardTitle>
                      <CardDescription>
                        Total: {formatCurrency(itemsTotal)}
                      </CardDescription>
                    </div>
                     <Button onClick={() => openItemModal()}>
                       <Plus className="h-4 w-4 mr-2" />
                       Adicionar Item
                     </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                     <div className="text-center py-8">
                       <p className="text-muted-foreground mb-4">Nenhum item adicionado ainda</p>
                       <Button onClick={() => openItemModal()}>
                         <Plus className="h-4 w-4 mr-2" />
                         Adicionar primeiro item
                       </Button>
                     </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="w-20">Qtd</TableHead>
                          <TableHead className="w-32">Preço Compra</TableHead>
                          <TableHead className="w-32">Preço Venda</TableHead>
                          <TableHead className="w-32">Subtotal</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Input
                                value={item.name}
                                onChange={(e) => updateItem(item.id, "name", e.target.value)}
                                className="border-0 p-0 h-8 focus-visible:ring-1"
                              />
                            </TableCell>
                             <TableCell>
                               <Input
                                 type="number"
                                 step="0.01"
                                 min="0"
                                 value={item.quantity}
                                 onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                 onFocus={(e) => e.target.select()}
                                 className="border-0 p-0 h-8 text-center focus-visible:ring-1"
                               />
                             </TableCell>
                             <TableCell>
                               <Input
                                 type="number"
                                 step="0.01"
                                 min="0"
                                 value={item.purchase_price}
                                 onChange={(e) => updateItem(item.id, "purchase_price", parseFloat(e.target.value) || 0)}
                                 onFocus={(e) => e.target.select()}
                                 className="border-0 p-0 h-8 text-right focus-visible:ring-1"
                               />
                             </TableCell>
                             <TableCell>
                               <Input
                                 type="number"
                                 step="0.01"
                                 min="0"
                                 value={item.sale_price}
                                 onChange={(e) => updateItem(item.id, "sale_price", parseFloat(e.target.value) || 0)}
                                 onFocus={(e) => e.target.select()}
                                 className="border-0 p-0 h-8 text-right focus-visible:ring-1"
                               />
                             </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                             <TableCell>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => deleteItem(item.id)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Selecione um ambiente</h3>
                    <p className="text-muted-foreground mb-4">
                      Escolha um ambiente na barra lateral para adicionar itens
                    </p>
                    <Button onClick={addEnvironment}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro ambiente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <EnvironmentModal
        environment={editingEnvironment}
        open={environmentModalOpen}
        onOpenChange={setEnvironmentModalOpen}
        onSave={saveEnvironment}
        onDelete={deleteEnvironment}
      />
      
          <ItemModal
            item={editingItem}
            open={itemModalOpen}
            onOpenChange={setItemModalOpen}
            onSave={saveItem}
            environmentId={selectedEnvId || ""}
            settings={settings}
          />
    </div>
  );
};

export default BudgetEditor;