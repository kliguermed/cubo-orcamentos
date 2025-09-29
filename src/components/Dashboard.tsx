import { useState, useEffect } from "react";
import { Plus, Settings, FileText, Edit, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Budget {
  id: string;
  protocol_number: number;
  client_name: string;
  status: "editing" | "finished";
  total_amount: number;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBudgets((data as Budget[]) || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar orçamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    try {
      // Fetch user's current settings to use as default for new budget
      const { data: settingsData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("budgets")
        .insert([
          {
            client_name: "Novo Cliente",
            user_id: user?.id,
            // Copy calculation rules from settings to budget
            markup_percentage: settingsData?.markup_percentage || 0,
            rt_type: settingsData?.rt_type || 'percentage',
            rt_value: settingsData?.rt_value || 0,
            rt_distribution: settingsData?.rt_distribution || 'diluted',
            labor_type: settingsData?.labor_type || 'percentage',
            labor_value: settingsData?.labor_value || 0
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Orçamento criado",
        description: `Protocolo #${data.protocol_number}`,
      });

      fetchBudgets();
      navigate(`/budget/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao criar orçamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm("Tem certeza que deseja excluir este orçamento?")) return;

    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetId);

      if (error) throw error;

      toast({
        title: "Orçamento excluído",
        description: "O orçamento foi removido com sucesso",
      });

      fetchBudgets();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir orçamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/LOGO-CUBO/SIMBOLO-P.png" 
              alt="Cubo Casa Inteligente" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold">Sistema de Orçamentos</h1>
              <p className="text-sm text-muted-foreground">Cubo Casa Inteligente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/configuration-manager")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Orçamentos</h2>
            <p className="text-muted-foreground">
              {budgets.length === 0 
                ? "Nenhum orçamento criado ainda"
                : `${budgets.length} orçamento${budgets.length > 1 ? 's' : ''} encontrado${budgets.length > 1 ? 's' : ''}`
              }
            </p>
          </div>
          <Button onClick={handleCreateBudget}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {/* Budget List */}
        {budgets.length === 0 ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Nenhum orçamento ainda</CardTitle>
              <CardDescription>
                Crie seu primeiro orçamento para começar
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={handleCreateBudget}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro orçamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <Card key={budget.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">#{budget.protocol_number}</CardTitle>
                      <CardDescription>{budget.client_name}</CardDescription>
                    </div>
                    <Badge variant={budget.status === "finished" ? "default" : "secondary"}>
                      {budget.status === "finished" ? "Finalizado" : "Em edição"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-medium">{formatCurrency(budget.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Criado em:</span>
                      <span>{formatDate(budget.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/budget/${budget.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/proposal/${budget.id}`)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Proposta
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;