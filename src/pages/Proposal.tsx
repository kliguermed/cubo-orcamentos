import { useState, useEffect } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Budget {
  id: string;
  protocol_number: number;
  client_name: string;
  client_cpf_cnpj: string;
  client_phone: string;
  client_email: string;
  total_amount: number;
  created_at: string;
}

interface Environment {
  id: string;
  name: string;
  description: string;
  subtotal: number;
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  sale_price: number;
  subtotal: number;
}

interface Settings {
  labor_type: string;
  labor_value: number;
  rt_type: string;
  rt_value: number;
  markup_percentage: number;
  rt_distribution: string;
  payment_terms: string;
}

const Proposal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (id) {
      fetchProposalData();
    }
  }, [id]);

  const fetchProposalData = async () => {
    try {
      const [budgetRes, envRes, settingsRes] = await Promise.all([
        supabase.from("budgets").select("*").eq("id", id).single(),
        supabase.from("environments").select(`
          *,
          items (*)
        `).eq("budget_id", id),
        supabase.from("settings").select("*").single()
      ]);

      if (budgetRes.error) throw budgetRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setBudget(budgetRes.data as Budget);
      setEnvironments(envRes.data || []);
      setSettings(settingsRes.data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar proposta",
        description: error.message,
        variant: "destructive",
      });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const calculateTotals = () => {
    const subtotalItems = environments.reduce((sum, env) => 
      sum + env.items.reduce((envSum, item) => envSum + item.subtotal, 0), 0
    );

    let laborCost = 0;
    let rtCost = 0;

    if (settings) {
      // Calculate labor cost
      if (settings.labor_type === "fixed") {
        laborCost = settings.labor_value;
      } else if (settings.labor_type === "percentage") {
        laborCost = subtotalItems * (settings.labor_value / 100);
      }

      // Calculate RT cost (only if separate)
      if (settings.rt_distribution === "separate") {
        if (settings.rt_type === "fixed") {
          rtCost = settings.rt_value;
        } else if (settings.rt_type === "percentage") {
          rtCost = subtotalItems * (settings.rt_value / 100);
        }
      }
    }

    const total = subtotalItems + laborCost + rtCost;

    return {
      subtotalItems,
      laborCost,
      rtCost,
      total
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // This would integrate with a PDF generation library
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A exportação em PDF será implementada em breve",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!budget || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Proposta não encontrada</h2>
          <Button onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hidden in print */}
      <header className="border-b bg-card print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold">Proposta Comercial</h1>
              <p className="text-sm text-muted-foreground">
                Protocolo #{budget.protocol_number} - {budget.client_name}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Proposal Content */}
      <main className="container mx-auto px-4 py-8 print:px-0 print:py-4">
        <div className="max-w-4xl mx-auto bg-white print:bg-transparent print:shadow-none">
          {/* Header with Logo */}
          <div className="text-center border-b pb-6 mb-8 print:border-black">
            <img 
              src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/LOGO-CUBO/SIMBOLO-P.png" 
              alt="Cubo Casa Inteligente" 
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">PROPOSTA COMERCIAL</h1>
            <p className="text-gray-600">Protocolo #{budget.protocol_number}</p>
          </div>

          {/* Client Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">DADOS DO CLIENTE</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nome:</span> {budget.client_name}
              </div>
              {budget.client_cpf_cnpj && (
                <div>
                  <span className="font-medium">CPF/CNPJ:</span> {budget.client_cpf_cnpj}
                </div>
              )}
              {budget.client_phone && (
                <div>
                  <span className="font-medium">Telefone:</span> {budget.client_phone}
                </div>
              )}
              {budget.client_email && (
                <div>
                  <span className="font-medium">E-mail:</span> {budget.client_email}
                </div>
              )}
              <div>
                <span className="font-medium">Data:</span> {formatDate(budget.created_at)}
              </div>
            </div>
          </div>

          {/* Environments and Items */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-6 text-gray-900">ITENS DO ORÇAMENTO</h2>
            
            {environments.map((env) => (
              <div key={env.id} className="mb-8">
                <h3 className="text-md font-semibold mb-4 text-gray-800 bg-gray-50 p-3 rounded">
                  {env.name}
                </h3>
                
                {env.description && (
                  <p className="text-sm text-gray-600 mb-4">{env.description}</p>
                )}
                
                <table className="w-full text-sm border-collapse border border-gray-300 mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left">Item</th>
                      <th className="border border-gray-300 px-3 py-2 text-center w-20">Qtd</th>
                      <th className="border border-gray-300 px-3 py-2 text-right w-32">Valor Unit.</th>
                      <th className="border border-gray-300 px-3 py-2 text-right w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {env.items.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-3 py-2">{item.name}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {item.quantity.toFixed(2).replace('.00', '')}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          {formatCurrency(item.sale_price)}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="border border-gray-300 px-3 py-2 font-medium text-right">
                        Total do Ambiente:
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                        {formatCurrency(env.items.reduce((sum, item) => sum + item.subtotal, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="border-t pt-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">RESUMO FINANCEIRO</h2>
            
            <div className="bg-gray-50 p-4 rounded">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1">Subtotal dos Itens:</td>
                    <td className="py-1 text-right font-medium">{formatCurrency(totals.subtotalItems)}</td>
                  </tr>
                  {totals.laborCost > 0 && (
                    <tr>
                      <td className="py-1">Mão de Obra:</td>
                      <td className="py-1 text-right font-medium">{formatCurrency(totals.laborCost)}</td>
                    </tr>
                  )}
                  {totals.rtCost > 0 && (
                    <tr>
                      <td className="py-1">Responsabilidade Técnica:</td>
                      <td className="py-1 text-right font-medium">{formatCurrency(totals.rtCost)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-300 font-bold text-lg">
                    <td className="py-2">VALOR TOTAL:</td>
                    <td className="py-2 text-right">{formatCurrency(totals.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Terms */}
          {settings.payment_terms && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">CONDIÇÕES DE PAGAMENTO</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {settings.payment_terms}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Proposal;