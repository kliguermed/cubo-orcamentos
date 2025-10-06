import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Save, Trash2, Upload, Edit2, Eye, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { GlobalSummaryModal } from "@/components/GlobalSummaryModal";
import { ProposalEditorModal } from "@/components/ProposalEditor/ProposalEditorModal";
import { FEATURE_FLAGS } from "@/lib/featureFlags";
import { applyEnvironmentCovers } from "@/utils/applyEnvironmentCovers";
interface Budget {
  id: string;
  protocol_number: number;
  client_name: string;
  client_cpf_cnpj: string;
  client_phone: string;
  client_email: string;
  status: "editing" | "finished";
  total_amount: number;
  // Calculation rules specific to this budget
  markup_percentage: number;
  rt_type: string;
  rt_value: number;
  rt_distribution: string;
  labor_type: string;
  labor_value: number;
}
interface Environment {
  id: string;
  name: string;
  description: string;
  image_url: string;
  cover_image_url?: string;
  subtotal: number;
}
interface Item {
  id: string;
  environment_id: string;
  name: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  subtotal?: number;
}
const BudgetEditor = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [environmentModalOpen, setEnvironmentModalOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [globalSummaryOpen, setGlobalSummaryOpen] = useState(false);
  const [allEnvironmentItems, setAllEnvironmentItems] = useState<{
    [envId: string]: Item[];
  }>({});
  const [clientDataExpanded, setClientDataExpanded] = useState(false);
  const [calculationRulesExpanded, setCalculationRulesExpanded] = useState(false);
  const [proposalEditorOpen, setProposalEditorOpen] = useState(false);
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

  // Update budget total when environments or budget rules change
  useEffect(() => {
    if (environments.length > 0 && budget) {
      updateBudgetTotalAmount();
      fetchAllEnvironmentItems();
    }
  }, [environments.length, budget?.markup_percentage, budget?.rt_value, budget?.labor_value]);

  // Fetch items for all environments to show totals correctly
  const fetchAllEnvironmentItems = async () => {
    if (environments.length === 0) return;
    try {
      const {
        data: allItems,
        error
      } = await supabase.from("items").select("*").in("environment_id", environments.map(env => env.id));
      if (error) throw error;

      // Group items by environment_id
      const itemsByEnv: {
        [envId: string]: Item[];
      } = {};
      environments.forEach(env => {
        itemsByEnv[env.id] = (allItems || []).filter(item => item.environment_id === env.id);
      });
      setAllEnvironmentItems(itemsByEnv);
    } catch (error: any) {
      console.error("Erro ao buscar itens dos ambientes:", error);
    }
  };
  const fetchBudgetData = async () => {
    try {
      const [budgetRes, envRes] = await Promise.all([supabase.from("budgets").select("*").eq("id", id).single(), supabase.from("environments").select("*").eq("budget_id", id)]);
      if (budgetRes.error) throw budgetRes.error;
      setBudget(budgetRes.data as Budget);
      setEnvironments(envRes.data || []);
      if (envRes.data && envRes.data.length > 0) {
        setSelectedEnvId(envRes.data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar orçamento",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchItems = async (envId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("items").select("*").eq("environment_id", envId);
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar itens",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const addEnvironment = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("environments").insert([{
        budget_id: id,
        name: "Novo Ambiente",
        description: ""
      }]).select().single();
      if (error) throw error;
      setEnvironments(prev => [...prev, data]);
      setSelectedEnvId(data.id);
      
      // Aplicar capas automaticamente
      if (id) {
        await applyEnvironmentCovers(id);
        // Recarregar ambientes para pegar as capas aplicadas
        const { data: updatedEnvs } = await supabase
          .from("environments")
          .select("*")
          .eq("budget_id", id);
        if (updatedEnvs) {
          setEnvironments(updatedEnvs);
        }
      }
      
      toast({
        title: "Ambiente adicionado",
        description: "Novo ambiente criado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar ambiente",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const addItem = async () => {
    if (!selectedEnvId) return;
    try {
      const {
        data,
        error
      } = await supabase.from("items").insert([{
        environment_id: selectedEnvId,
        name: "Novo Item",
        quantity: 1,
        purchase_price: 0
      }]).select().single();
      if (error) throw error;
      setItems(prev => [...prev, data]);
      toast({
        title: "Item adicionado",
        description: "Novo item criado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const calculateSalePrice = (purchasePrice: number, quantity: number = 1) => {
    if (!budget) return purchasePrice;
    let salePrice = purchasePrice;

    // Apply markup
    if (budget.markup_percentage > 0) {
      salePrice = salePrice * (1 + budget.markup_percentage / 100);
    }

    // Apply RT (if percentage and diluted)
    if (budget.rt_type === "percentage" && budget.rt_distribution === "diluted" && budget.rt_value > 0) {
      salePrice = salePrice * (1 + budget.rt_value / 100);
    } else if (budget.rt_type === "fixed" && budget.rt_distribution === "diluted" && budget.rt_value > 0) {
      // Add fixed RT value divided by quantity
      salePrice = salePrice + budget.rt_value / quantity;
    }
    return salePrice;
  };

  // Calculate environment totals for any environment (not just selected)
  const getEnvironmentFinalTotal = (envId: string, allEnvItems?: Item[]) => {
    if (!budget) return 0;

    // Use passed items or get from state
    let environmentItems: Item[];
    if (allEnvItems) {
      environmentItems = allEnvItems.filter(item => item.environment_id === envId);
    } else if (envId === selectedEnvId) {
      // For selected environment, use current items
      environmentItems = items;
    } else {
      // For other environments, use cached items
      environmentItems = allEnvironmentItems[envId] || [];
    }

    // Calculate items total from individual item subtotals
    const itemsTotal = environmentItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

    // Labor: fixed value per unit (quantity)
    const totalQuantity = environmentItems.reduce((sum, item) => sum + item.quantity, 0);
    const laborTotal = budget.labor_value * totalQuantity;

    // Return final total (items + labor)
    return itemsTotal + laborTotal;
  };

  // Calculate environment totals for selected environment
  const calculateEnvironmentTotals = () => {
    if (!selectedEnvId || !budget) return {
      itemsTotal: 0,
      laborTotal: 0,
      rtTotal: 0,
      purchaseTotal: 0,
      costTotal: 0,
      profitTotal: 0,
      finalTotal: 0
    };
    const environmentItems = items.filter(item => item.environment_id === selectedEnvId);

    // Calculate totals
    const itemsTotal = environmentItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const purchaseTotal = environmentItems.reduce((sum, item) => sum + item.purchase_price * item.quantity, 0);

    // Labor: fixed value per unit (quantity)
    const totalQuantity = environmentItems.reduce((sum, item) => sum + item.quantity, 0);
    const laborTotal = budget.labor_value * totalQuantity;

    // RT: calculate total RT applied to all items
    let rtTotal = 0;
    environmentItems.forEach(item => {
      const purchaseValue = item.purchase_price * item.quantity;
      let saleWithMarkup = purchaseValue;

      // Apply markup first
      if (budget.markup_percentage > 0) {
        saleWithMarkup = saleWithMarkup * (1 + budget.markup_percentage / 100);
      }

      // Calculate RT portion
      if (budget.rt_type === "percentage" && budget.rt_value > 0) {
        rtTotal += saleWithMarkup * (budget.rt_value / 100);
      } else if (budget.rt_type === "fixed" && budget.rt_value > 0) {
        rtTotal += budget.rt_value;
      }
    });
    const finalTotal = itemsTotal + laborTotal;
    const costTotal = purchaseTotal + laborTotal + rtTotal;
    const profitTotal = finalTotal - costTotal;
    return {
      itemsTotal,
      laborTotal,
      rtTotal,
      purchaseTotal,
      costTotal,
      profitTotal,
      finalTotal
    };
  };
  const updateItem = async (itemId: string, field: string, value: any) => {
    try {
      const currentItem = items.find(item => item.id === itemId);
      if (!currentItem) return;
      let updateData: any = {
        [field]: value
      };

      // Auto-calculate sale price when purchase price or quantity changes
      if (field === "purchase_price" || field === "quantity") {
        const newQuantity = field === "quantity" ? parseFloat(value) || 0 : currentItem.quantity;
        const newPurchasePrice = field === "purchase_price" ? parseFloat(value) || 0 : currentItem.purchase_price;
        updateData.sale_price = calculateSalePrice(newPurchasePrice, newQuantity);
      }

      // DO NOT calculate subtotal manually - let the database trigger handle it
      const {
        error
      } = await supabase.from("items").update(updateData).eq("id", itemId);
      if (error) throw error;

      // Wait for database trigger to calculate subtotal
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch the updated item with calculated subtotal
      const {
        data: updatedItem,
        error: fetchError
      } = await supabase.from("items").select("*").eq("id", itemId).single();
      if (fetchError) throw fetchError;
      setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));

      // Update environment subtotal and refresh all environment items
      await updateEnvironmentSubtotal();
      await fetchAllEnvironmentItems();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const deleteItem = async (itemId: string) => {
    try {
      const {
        error
      } = await supabase.from("items").delete().eq("id", itemId);
      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== itemId));
      await updateEnvironmentSubtotal();
      await fetchAllEnvironmentItems();
      toast({
        title: "Item removido",
        description: "Item foi removido com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover item",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const updateEnvironmentSubtotal = async () => {
    if (!selectedEnvId) return;

    // Calculate ONLY items total (not including labor)
    const totals = calculateEnvironmentTotals();
    const itemsSubtotal = totals.itemsTotal;
    try {
      const {
        error
      } = await supabase.from("environments").update({
        subtotal: itemsSubtotal
      }).eq("id", selectedEnvId);
      if (error) throw error;
      setEnvironments(prev => prev.map(env => env.id === selectedEnvId ? {
        ...env,
        subtotal: itemsSubtotal
      } : env));

      // Update total budget amount
      await updateBudgetTotalAmount();
    } catch (error: any) {
      console.error("Erro ao atualizar subtotal do ambiente:", error);
    }
  };
  const updateBudgetTotalAmount = async () => {
    if (!id || !budget) return;
    try {
      // Get all items from all environments
      const {
        data: allItems,
        error: itemsError
      } = await supabase.from("items").select("*").in("environment_id", environments.map(env => env.id));
      if (itemsError) throw itemsError;

      // Calculate total amount across all environments
      let totalAmount = 0;
      environments.forEach(env => {
        const envItems = allItems?.filter(item => item.environment_id === env.id) || [];
        totalAmount += getEnvironmentFinalTotal(env.id, envItems);
      });

      // Update budget total_amount
      const {
        error
      } = await supabase.from("budgets").update({
        total_amount: totalAmount
      }).eq("id", id);
      if (error) throw error;
      setBudget(prev => prev ? {
        ...prev,
        total_amount: totalAmount
      } : null);
    } catch (error: any) {
      console.error("Erro ao atualizar total do orçamento:", error);
    }
  };
  const saveBudgetClient = async () => {
    if (!budget) return;
    try {
      const {
        error
      } = await supabase.from("budgets").update({
        client_name: budget.client_name,
        client_cpf_cnpj: budget.client_cpf_cnpj,
        client_phone: budget.client_phone,
        client_email: budget.client_email
      }).eq("id", id);
      if (error) throw error;
      toast({
        title: "Dados salvos",
        description: "Dados do cliente atualizados com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const recalculateAllItems = async () => {
    if (!budget) return;
    try {
      // Get all items from all environments
      const {
        data: allItems,
        error: itemsError
      } = await supabase.from("items").select("*").in("environment_id", environments.map(env => env.id));
      if (itemsError) throw itemsError;
      if (!allItems || allItems.length === 0) return;

      // Recalculate each item with new rules - only update sale_price
      // The subtotal is calculated automatically by the database
      const updates = allItems.map(item => {
        const newSalePrice = calculateSalePrice(item.purchase_price, item.quantity);
        return supabase.from("items").update({
          sale_price: newSalePrice
        }).eq("id", item.id);
      });

      // Execute all updates in parallel
      await Promise.all(updates);

      // Wait a bit for triggers to process
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error("Erro ao recalcular itens:", error);
      throw error;
    }
  };
  const saveBudgetCalculationRules = async () => {
    if (!budget) return;
    try {
      // Save the new rules to the budget
      const {
        error
      } = await supabase.from("budgets").update({
        markup_percentage: budget.markup_percentage,
        rt_type: budget.rt_type,
        rt_value: budget.rt_value,
        rt_distribution: budget.rt_distribution,
        labor_type: budget.labor_type,
        labor_value: budget.labor_value
      }).eq("id", id);
      if (error) throw error;
      toast({
        title: "Recalculando...",
        description: "Aplicando novas regras a todos os itens"
      });

      // Recalculate all items with new rules
      await recalculateAllItems();

      // Refresh all data
      await fetchBudgetData();
      await fetchAllEnvironmentItems();

      // Refresh selected environment items
      if (selectedEnvId) {
        await fetchItems(selectedEnvId);
      }
      toast({
        title: "Regras atualizadas",
        description: "As regras de cálculo foram aplicadas com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar regras",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const saveEnvironment = async (environment: Environment) => {
    try {
      const {
        error
      } = await supabase.from("environments").update({
        name: environment.name,
        description: environment.description
      }).eq("id", environment.id);
      if (error) throw error;
      setEnvironments(prev => prev.map(env => env.id === environment.id ? {
        ...env,
        name: environment.name,
        description: environment.description
      } : env));
      toast({
        title: "Ambiente atualizado",
        description: "Dados do ambiente salvos com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar ambiente",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const deleteEnvironment = async (environmentId: string) => {
    try {
      const {
        error
      } = await supabase.from("environments").delete().eq("id", environmentId);
      if (error) throw error;
      setEnvironments(prev => prev.filter(env => env.id !== environmentId));
      if (selectedEnvId === environmentId) {
        setSelectedEnvId(null);
        setItems([]);
      }
      toast({
        title: "Ambiente removido",
        description: "Ambiente foi removido com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover ambiente",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const saveItem = async (itemData: Omit<Item, 'id'>) => {
    try {
      // Remove subtotal from itemData as it's calculated by database trigger
      const {
        subtotal,
        ...dataToSave
      } = itemData as any;
      if (editingItem) {
        // Update existing item
        const {
          error
        } = await supabase.from("items").update(dataToSave).eq("id", editingItem.id);
        if (error) throw error;
        toast({
          title: "Item atualizado",
          description: "Item foi atualizado com sucesso"
        });
      } else {
        // Create new item
        const {
          error
        } = await supabase.from("items").insert([dataToSave]).select();
        if (error) throw error;
        toast({
          title: "Item adicionado",
          description: "Novo item foi adicionado com sucesso"
        });
      }

      // Wait for database trigger to process
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refresh items to get calculated values
      await updateEnvironmentSubtotal();
      await fetchAllEnvironmentItems();
      setEditingItem(null);
    } catch (error: any) {
      toast({
        title: editingItem ? "Erro ao atualizar item" : "Erro ao adicionar item",
        description: error.message,
        variant: "destructive"
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
      currency: "BRL"
    }).format(value);
  };

  // Calculate global project totals
  const calculateGlobalTotals = async () => {
    if (!budget) return {
      purchaseTotal: 0,
      laborTotal: 0,
      rtTotal: 0,
      costTotal: 0,
      profitTotal: 0,
      finalTotal: 0,
      allItems: []
    };
    try {
      const {
        data: allItems,
        error
      } = await supabase.from("items").select("*, environments(name)").in("environment_id", environments.map(env => env.id));
      if (error) throw error;

      // Ordenar itens por ambiente e depois por nome do item
      const itemsWithEnvName = (allItems || []).sort((a, b) => {
        // Primeiro ordena por nome do ambiente
        const envNameA = a.environments?.name || '';
        const envNameB = b.environments?.name || '';
        if (envNameA !== envNameB) {
          return envNameA.localeCompare(envNameB);
        }

        // Se for o mesmo ambiente, ordena por nome do item
        return a.name.localeCompare(b.name);
      });
      let globalPurchaseTotal = 0;
      let globalLaborTotal = 0;
      let globalRtTotal = 0;
      let globalFinalTotal = 0;
      environments.forEach(env => {
        const envItems = itemsWithEnvName.filter(item => item.environment_id === env.id);

        // Purchase total
        const envPurchaseTotal = envItems.reduce((sum, item) => sum + item.purchase_price * item.quantity, 0);
        globalPurchaseTotal += envPurchaseTotal;

        // Items total (with markup)
        const envItemsTotal = envItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

        // Labor total
        const envTotalQuantity = envItems.reduce((sum, item) => sum + item.quantity, 0);
        const envLaborTotal = budget.labor_value * envTotalQuantity;
        globalLaborTotal += envLaborTotal;

        // RT total
        let envRtTotal = 0;
        envItems.forEach(item => {
          const purchaseValue = item.purchase_price * item.quantity;
          let saleWithMarkup = purchaseValue;
          if (budget.markup_percentage > 0) {
            saleWithMarkup = saleWithMarkup * (1 + budget.markup_percentage / 100);
          }
          if (budget.rt_type === "percentage" && budget.rt_value > 0) {
            envRtTotal += saleWithMarkup * (budget.rt_value / 100);
          } else if (budget.rt_type === "fixed" && budget.rt_value > 0) {
            envRtTotal += budget.rt_value;
          }
        });
        globalRtTotal += envRtTotal;

        // Final total for this environment
        globalFinalTotal += envItemsTotal + envLaborTotal;
      });
      const globalCostTotal = globalPurchaseTotal + globalLaborTotal + globalRtTotal;
      const globalProfitTotal = globalFinalTotal - globalCostTotal;
      return {
        purchaseTotal: globalPurchaseTotal,
        laborTotal: globalLaborTotal,
        rtTotal: globalRtTotal,
        costTotal: globalCostTotal,
        profitTotal: globalProfitTotal,
        finalTotal: globalFinalTotal,
        allItems: itemsWithEnvName
      };
    } catch (error) {
      console.error("Erro ao calcular totais globais:", error);
      return {
        purchaseTotal: 0,
        laborTotal: 0,
        rtTotal: 0,
        costTotal: 0,
        profitTotal: 0,
        finalTotal: 0,
        allItems: []
      };
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  if (!budget) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Orçamento não encontrado</h2>
          <Button onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
        </div>
      </div>;
  }
  const selectedEnvironment = environments.find(env => env.id === selectedEnvId);
  const environmentTotals = calculateEnvironmentTotals();
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size={isMobile ? "sm" : "sm"} onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            {!isMobile && "Voltar"}
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold truncate">Orçamento #{budget.protocol_number}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{budget.client_name}</p>
          </div>
          <div className="shrink-0">
            <Badge variant={budget.status === "finished" ? "default" : "secondary"} className="text-xs">
              {budget.status === "finished" ? "Finalizado" : "Em edição"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className={isMobile ? "space-y-6" : "grid lg:grid-cols-3 gap-8"}>
          {/* Left Column - Client & Environments */}
          <div className={isMobile ? "space-y-4" : "lg:col-span-1 space-y-6"}>
            {/* Client Info */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setClientDataExpanded(!clientDataExpanded)}>
                <div className="flex justify-between items-center">
                  <CardTitle>Dados do Cliente</CardTitle>
                  <Button variant="ghost" size="sm">
                    {clientDataExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {clientDataExpanded && <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="client-name">Nome completo</Label>
                    <Input id="client-name" value={budget.client_name} onChange={e => setBudget(prev => prev ? {
                  ...prev,
                  client_name: e.target.value
                } : null)} onFocus={e => {
                  if (e.target.value === "Nome do cliente") {
                    setBudget(prev => prev ? {
                      ...prev,
                      client_name: ""
                    } : null);
                  }
                  e.target.select();
                }} placeholder="Digite o nome do cliente" />
                  </div>
                  <div>
                    <Label htmlFor="client-cpf">CPF/CNPJ</Label>
                    <Input id="client-cpf" value={budget.client_cpf_cnpj || ""} onChange={e => setBudget(prev => prev ? {
                  ...prev,
                  client_cpf_cnpj: e.target.value
                } : null)} />
                  </div>
                  <div>
                    <Label htmlFor="client-phone">Telefone</Label>
                    <Input id="client-phone" value={budget.client_phone || ""} onChange={e => setBudget(prev => prev ? {
                  ...prev,
                  client_phone: e.target.value
                } : null)} />
                  </div>
                  <div>
                    <Label htmlFor="client-email">E-mail</Label>
                    <Input id="client-email" type="email" value={budget.client_email || ""} onChange={e => setBudget(prev => prev ? {
                  ...prev,
                  client_email: e.target.value
                } : null)} />
                  </div>
                  <div className="pt-4">
                    <Button onClick={saveBudgetClient} className="w-full" size={isMobile ? "sm" : "default"}>
                      <Save className="h-4 w-4 mr-2" />
                      {isMobile ? "Salvar" : "Salvar dados do cliente"}
                    </Button>
                  </div>
                </CardContent>}
            </Card>

            {/* Calculation Rules */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setCalculationRulesExpanded(!calculationRulesExpanded)}>
                <div className="flex justify-between items-center">
                  <CardTitle>Regras de Cálculo</CardTitle>
                  <Button variant="ghost" size="sm">
                    {calculationRulesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>Regras específicas deste orçamento</CardDescription>
              </CardHeader>
              {calculationRulesExpanded && <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="markup">Markup (%)</Label>
                    <Input id="markup" type="number" value={budget.markup_percentage} onChange={e => setBudget(prev => prev ? {
                  ...prev,
                  markup_percentage: Number(e.target.value)
                } : null)} onFocus={e => e.target.select()} />
                  </div>
                  
                  <div>
                    <Label htmlFor="rt-value">RT - Valor {budget.rt_type === 'percentage' ? '(%)' : '(R$)'}</Label>
                    <Input id="rt-value" type="number" value={budget.rt_value} onChange={e => setBudget(prev => prev ? {
                  ...prev,
                  rt_value: Number(e.target.value)
                } : null)} onFocus={e => e.target.select()} />
                  </div>
                  
                  <div>
                    <Label htmlFor="labor-value">Mão de Obra - Valor (R$ por unidade)</Label>
                    <Input id="labor-value" type="number" value={budget.labor_value} onChange={e => setBudget(prev => prev ? {
                  ...prev,
                  labor_value: Number(e.target.value)
                } : null)} onFocus={e => e.target.select()} />
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={saveBudgetCalculationRules} className="w-full" size={isMobile ? "sm" : "default"}>
                      <Save className="h-4 w-4 mr-2" />
                      {isMobile ? "Salvar" : "Salvar regras de cálculo"}
                    </Button>
                  </div>
                </CardContent>}
            </Card>

            {/* Environments */}
            <Card>
              <CardHeader>
                <CardTitle>Ambientes</CardTitle>
                <CardDescription>Organize o orçamento por ambientes</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-2 mb-4">
                   {environments.map(env => <div key={env.id} className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedEnvId === env.id ? "bg-accent" : "hover:bg-accent/50"}`} onClick={() => setSelectedEnvId(env.id)}>
                       <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{env.name}</div>
                             <div className="text-sm text-muted-foreground">
                               {formatCurrency(getEnvironmentFinalTotal(env.id))}
                             </div>
                          </div>
                         <Button variant="ghost" size="sm" onClick={e => {
                      e.stopPropagation();
                      openEnvironmentModal(env);
                    }}>
                           <Edit2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>)}
                  </div>
                  
                  {/* Global Project Value */}
                  {environments.length > 0 && <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex justify-between items-center cursor-pointer hover:bg-primary/10 p-2 rounded transition-colors" onClick={() => setGlobalSummaryOpen(true)}>
                        <div>
                          <div className="font-semibold text-primary">Valor Global do Projeto</div>
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(budget?.total_amount || 0)}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Resumo
                        </Button>
                      </div>
                    </div>}
                  
                   <div className={isMobile ? "space-y-2" : "flex justify-between items-center mb-4"}>
                     <Button onClick={addEnvironment} variant="outline" size={isMobile ? "sm" : "default"} className={isMobile ? "w-full" : ""}>
                       <Plus className="h-4 w-4 mr-2" />
                       {isMobile ? "Novo Ambiente" : "Adicionar Ambiente"}
                     </Button>
                     <div className={isMobile ? "flex flex-col gap-2" : "flex gap-2"}>
                       {FEATURE_FLAGS.proposalImageLibrary && <Button onClick={() => setProposalEditorOpen(true)} variant="secondary" size={isMobile ? "sm" : "default"} className={isMobile ? "w-full" : ""}>
                           <ImageIcon className="h-4 w-4 mr-2" />
                           {isMobile ? "Capas" : "Formatar Proposta"}
                         </Button>}
                       
                     </div>
                   </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Items */}
          <div className={isMobile ? "" : "lg:col-span-2"}>
            {selectedEnvironment ? <Card>
                <CardHeader>
                  <div className={isMobile ? "space-y-3" : "flex justify-between items-start"}>
                    <div className={isMobile ? "text-center" : ""}>
                       <CardTitle className={isMobile ? "text-lg" : ""}>{selectedEnvironment.name}</CardTitle>
                       <CardDescription className={isMobile ? "text-sm" : ""}>
                         Total: {formatCurrency(environmentTotals.finalTotal)}
                       </CardDescription>
                    </div>
                     <Button onClick={() => openItemModal()} size={isMobile ? "sm" : "default"} className={isMobile ? "w-full" : ""}>
                       <Plus className="h-4 w-4 mr-2" />
                       {isMobile ? "Novo Item" : "Adicionar Item"}
                     </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? <div className="text-center py-8">
                       <p className="text-muted-foreground mb-4">Nenhum item adicionado ainda</p>
                       <Button onClick={() => openItemModal()} size={isMobile ? "sm" : "default"}>
                         <Plus className="h-4 w-4 mr-2" />
                         {isMobile ? "Novo Item" : "Adicionar primeiro item"}
                       </Button>
                     </div> : isMobile ? <div className="space-y-3">
                         {items.map(item => <Card key={item.id} className="p-3">
                             <div className="space-y-3">
                               <div>
                                 <Label className="text-xs text-muted-foreground">Nome do Item</Label>
                                 <Input value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} className="h-8 text-sm" />
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                 <div>
                                   <Label className="text-xs text-muted-foreground">Qtd</Label>
                                   <Input type="number" step="0.01" min="0" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} className="h-8 text-center text-sm" />
                                 </div>
                                 <div>
                                   <Label className="text-xs text-muted-foreground">Preço Compra</Label>
                                   <Input type="number" step="0.01" min="0" value={item.purchase_price} onChange={e => updateItem(item.id, "purchase_price", parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} className="h-8 text-right text-sm" />
                                 </div>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                 <div>
                                   <Label className="text-xs text-muted-foreground">Preço Venda</Label>
                                   <div className="text-sm font-medium text-muted-foreground bg-muted/30 rounded px-2 py-1 h-8 flex items-center justify-end">
                                     {formatCurrency(item.sale_price)}
                                   </div>
                                 </div>
                                 <div>
                                   <Label className="text-xs text-muted-foreground">Subtotal</Label>
                                   <div className="text-sm font-bold text-primary bg-primary/10 rounded px-2 py-1 h-8 flex items-center justify-end">
                                     {formatCurrency(item.subtotal)}
                                   </div>
                                 </div>
                               </div>
                               <Button variant="outline" size="sm" onClick={() => deleteItem(item.id)} className="w-full text-destructive hover:text-destructive">
                                 <Trash2 className="h-4 w-4 mr-2" />
                                 Remover Item
                               </Button>
                             </div>
                           </Card>)}
                       </div> : <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Item</TableHead>
                              <TableHead className="w-20">Qtd</TableHead>
                              <TableHead className="w-32">Preço Compra</TableHead>
                              <TableHead className="w-32">Preço Venda</TableHead>
                              <TableHead className="w-32">Subtotal</TableHead>
                              <TableHead className="w-16"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map(item => <TableRow key={item.id}>
                                <TableCell className="min-w-[200px]">
                                  <Input value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} className="border-0 p-0 h-8 focus-visible:ring-1" />
                                </TableCell>
                                 <TableCell>
                                   <Input type="number" step="0.01" min="0" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} className="border-0 p-0 h-8 text-center focus-visible:ring-1" />
                                 </TableCell>
                                 <TableCell>
                                   <Input type="number" step="0.01" min="0" value={item.purchase_price} onChange={e => updateItem(item.id, "purchase_price", parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} className="border-0 p-0 h-8 text-right focus-visible:ring-1" />
                                 </TableCell>
                                  <TableCell>
                                    <div className="text-right text-sm font-medium text-muted-foreground bg-muted/30 rounded px-2 py-1">
                                      {formatCurrency(item.sale_price)}
                                    </div>
                                  </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.subtotal)}
                                </TableCell>
                                 <TableCell>
                                   <Button variant="outline" size="sm" onClick={() => deleteItem(item.id)}>
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </TableCell>
                              </TableRow>)}
                          </TableBody>
                         </Table>
                       </div>}
                   
                     {/* Environment Summary */}
                     {items.length > 0 && <div className="mt-6 p-3 sm:p-4 bg-muted/50 rounded-lg">
                         <h3 className={isMobile ? "text-base font-semibold mb-3 text-center" : "text-lg font-semibold mb-4"}>Resumo do Ambiente</h3>
                         <div className={isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 md:grid-cols-3 gap-4"}>
                           <div className="text-center">
                             <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Valor de Compra</div>
                             <div className={isMobile ? "text-sm font-semibold" : "text-lg font-semibold"}>{formatCurrency(environmentTotals.purchaseTotal)}</div>
                           </div>
                           <div className="text-center">
                             <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Mão de Obra</div>
                             <div className={isMobile ? "text-sm font-semibold text-blue-600" : "text-lg font-semibold text-blue-600"}>{formatCurrency(environmentTotals.laborTotal)}</div>
                           </div>
                           <div className="text-center">
                             <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>RT Total</div>
                             <div className={isMobile ? "text-sm font-semibold text-green-600" : "text-lg font-semibold text-green-600"}>{formatCurrency(environmentTotals.rtTotal)}</div>
                           </div>
                           <div className="text-center">
                             <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Custo Total</div>
                             <div className={isMobile ? "text-sm font-semibold text-orange-600" : "text-lg font-semibold text-orange-600"}>{formatCurrency(environmentTotals.costTotal)}</div>
                           </div>
                           <div className="text-center">
                             <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Lucro Total</div>
                             <div className={isMobile ? "text-sm font-semibold text-purple-600" : "text-lg font-semibold text-purple-600"}>{formatCurrency(environmentTotals.profitTotal)}</div>
                           </div>
                           <div className="text-center">
                             <div className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Total Final</div>
                             <div className={isMobile ? "text-lg font-bold text-primary" : "text-xl font-bold text-primary"}>{formatCurrency(environmentTotals.finalTotal)}</div>
                           </div>
                         </div>
                       </div>}
                 </CardContent>
               </Card> : <Card>
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
              </Card>}
          </div>
        </div>
      </main>

      {/* Modals */}
      <EnvironmentModal environment={editingEnvironment} open={environmentModalOpen} onOpenChange={setEnvironmentModalOpen} onSave={saveEnvironment} onDelete={deleteEnvironment} />
      
      <ItemModal item={editingItem} open={itemModalOpen} onOpenChange={setItemModalOpen} onSave={saveItem} environmentId={selectedEnvId || ""} settings={budget} />

      <GlobalSummaryModal open={globalSummaryOpen} onOpenChange={setGlobalSummaryOpen} calculateGlobalTotals={calculateGlobalTotals} />
      
      {FEATURE_FLAGS.proposalImageLibrary && <ProposalEditorModal open={proposalEditorOpen} onOpenChange={setProposalEditorOpen} environments={environments} onUpdateEnvironmentCover={async (envId: string, coverUrl: string) => {
      try {
        const {
          error
        } = await supabase.from('environments').update({
          cover_image_url: coverUrl
        }).eq('id', envId);
        if (error) throw error;
        setEnvironments(prev => prev.map(e => e.id === envId ? {
          ...e,
          cover_image_url: coverUrl
        } : e));
        toast({
          title: 'Capa atualizada',
          description: 'A capa do ambiente foi alterada com sucesso!'
        });
      } catch (error: any) {
        toast({
          title: 'Erro ao atualizar capa',
          description: error.message,
          variant: 'destructive'
        });
      }
    }} />}
    </div>;
};
export default BudgetEditor;