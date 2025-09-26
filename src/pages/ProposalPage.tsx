import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
interface Budget {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_cpf_cnpj: string;
  created_at: string;
  total_amount: number;
}
interface Item {
  id: string;
  name: string;
  quantity: number;
  sale_price: number;
  purchase_price: number;
  subtotal: number;
}
interface Environment {
  id: string;
  name: string;
  description: string;
  subtotal: number;
  cover_image_url: string;
  items: Item[];
}
interface Settings {
  labor_type: string;
  labor_value: number;
  rt_type: string;
  rt_value: number;
  rt_distribution: string;
  markup_percentage: number;
  payment_terms: string;
}
interface PageLayouts {
  cover_title: string;
  service_scope: string;
  warranty_text: string;
  payment_methods: string;
  closing_text: string;
  cover_background: boolean;
  warranty_background: boolean;
  closing_background: boolean;
}
const ProposalPage: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pageLayouts, setPageLayouts] = useState<PageLayouts | null>(null);
  useEffect(() => {
    if (id) {
      fetchProposalData();
    }
  }, [id]);
  const fetchProposalData = async () => {
    try {
      // Fetch budget
      const {
        data: budgetData,
        error: budgetError
      } = await supabase.from('budgets').select('*').eq('id', id).single();
      if (budgetError) throw budgetError;
      setBudget(budgetData);

      // Fetch environments with items
      const {
        data: environmentsData,
        error: environmentsError
      } = await supabase.from('environments').select(`
          id,
          name,
          description,
          subtotal,
          cover_image_url,
          items (
            id,
            name,
            quantity,
            sale_price,
            purchase_price,
            subtotal
          )
        `).eq('budget_id', id);
      if (environmentsError) throw environmentsError;
      setEnvironments(environmentsData || []);

      // Fetch settings
      const {
        data: settingsData,
        error: settingsError
      } = await supabase.from('settings').select('*').eq('user_id', budgetData?.user_id).single();
      if (settingsError) throw settingsError;
      setSettings(settingsData);

      // Fetch page layouts
      const {
        data: layoutsData,
        error: layoutsError
      } = await supabase.from('page_layouts').select('*').eq('user_id', budgetData?.user_id).single();
      if (layoutsError) throw layoutsError;
      setPageLayouts(layoutsData);
    } catch (error) {
      console.error('Error fetching proposal data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da proposta.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  const calculateEnvironmentLabor = (env: Environment): number => {
    if (!settings) return 0;
    const totalQuantity = env.items.reduce((sum, item) => sum + item.quantity, 0);
    return settings.labor_value * totalQuantity;
  };
  const calculateEnvironmentRT = (env: Environment): number => {
    if (!settings) return 0;
    if (settings.rt_distribution === 'diluted') {
      const totalItems = env.subtotal;
      if (settings.rt_type === 'percentage') {
        return totalItems * (settings.rt_value / 100);
      }
      return settings.rt_value;
    }
    return 0;
  };
  const calculateEnvironmentPurchaseTotal = (env: Environment): number => {
    return env.items.reduce((sum, item) => sum + item.purchase_price * item.quantity, 0);
  };
  const calculateEnvironmentCostTotal = (env: Environment): number => {
    const purchaseTotal = calculateEnvironmentPurchaseTotal(env);
    const laborTotal = calculateEnvironmentLabor(env);
    const rtTotal = calculateEnvironmentRT(env);
    return purchaseTotal + laborTotal + rtTotal;
  };
  const calculateEnvironmentProfitTotal = (env: Environment): number => {
    const finalTotal = env.subtotal + calculateEnvironmentLabor(env) + calculateEnvironmentRT(env);
    const costTotal = calculateEnvironmentCostTotal(env);
    return finalTotal - costTotal;
  };
  const calculateTotals = () => {
    const purchaseTotal = environments.reduce((sum, env) => sum + calculateEnvironmentPurchaseTotal(env), 0);
    const subtotal = environments.reduce((sum, env) => sum + env.subtotal, 0);
    const totalLabor = environments.reduce((sum, env) => sum + calculateEnvironmentLabor(env), 0);
    const totalRT = environments.reduce((sum, env) => sum + calculateEnvironmentRT(env), 0);
    const costTotal = purchaseTotal + totalLabor + totalRT;
    const grandTotal = subtotal + totalLabor + totalRT;
    const profitTotal = grandTotal - costTotal;
    return {
      purchaseTotal,
      subtotal,
      totalLabor,
      totalRT,
      costTotal,
      profitTotal,
      grandTotal
    };
  };
  const handlePrint = () => {
    window.print();
  };
  const handleDownloadPDF = () => {
    window.print();
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>;
  }
  if (!budget) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta não encontrada</h1>
          <p className="text-muted-foreground">A proposta solicitada não foi encontrada.</p>
        </div>
      </div>;
  }
  const totals = calculateTotals();
  return <div className="min-h-screen bg-background">
      {/* Print/Export Controls - Hidden in print */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
        <Button onClick={handleDownloadPDF} variant="default" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Main Cover Page */}
      <section className="min-h-screen flex flex-col items-center justify-center text-white relative print:page-break-after-always" style={{
      backgroundImage: pageLayouts?.cover_background ? 'url(https://reugilk.s3.us-east-2.amazonaws.com/cubo/fundo-2.jpg)' : 'none',
      backgroundColor: pageLayouts?.cover_background ? 'transparent' : '#000'
    }}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4">
          <img src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/LOGO-CUBO/SIMBOLO-B.png" alt="Logo Cubo" className="w-32 h-32 mx-auto mb-8" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {pageLayouts?.cover_title || 'Proposta Comercial'}
          </h1>
          <h2 className="text-2xl md:text-3xl font-light mb-2">{budget.client_name}</h2>
          <p className="text-lg opacity-90">{formatDate(budget.created_at)}</p>
        </div>
      </section>

      {/* Environment Pages */}
      {environments.map(environment => <React.Fragment key={environment.id}>
          {/* Environment Cover */}
          <section className="min-h-screen flex flex-col items-center justify-center text-white relative print:page-break-after-always" style={{
        backgroundImage: environment.cover_image_url ? `url(${environment.cover_image_url})` : 'url(https://reugilk.s3.us-east-2.amazonaws.com/cubo/fundo-2.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 text-center px-4">
              <img src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/LOGO-CUBO/SIMBOLO-B.png" alt="Logo Cubo" className="w-24 h-24 mx-auto mb-6" />
              <h1 className="text-3xl md:text-5xl font-bold">{environment.name}</h1>
            </div>
          </section>

          {/* Environment Items Page */}
          <section className="min-h-screen bg-white text-black p-8 print:page-break-after-always">
            <div className="max-w-4xl mx-auto">
              <header className="mb-8 text-center">
                <img src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/LOGO-CUBO/SIMBOLO-P.png" alt="Logo Cubo" className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-2xl font-bold">{environment.name}</h1>
              </header>

              {environment.description && <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-2">Descrição do Ambiente</h2>
                  <p className="text-gray-700 leading-relaxed">{environment.description}</p>
                </div>}

              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Itens Inclusos</h2>
                <div className="space-y-3">
                  {environment.items.map(item => <div key={item.id} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.sale_price)}</p>
                          <p className="text-sm text-gray-600">
                            Subtotal: {formatCurrency(item.subtotal || item.sale_price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Environment Totals */}
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Resumo do Ambiente</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal dos Itens:</span>
                    <span className="font-medium">{formatCurrency(environment.subtotal)}</span>
                  </div>
                  {settings && <div className="flex justify-between">
                      <span>Mão de Obra:</span>
                      <span className="font-medium">{formatCurrency(calculateEnvironmentLabor(environment))}</span>
                    </div>}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Subtotal do Ambiente:</span>
                      <span>
                        {formatCurrency(environment.subtotal + calculateEnvironmentLabor(environment))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </React.Fragment>)}

      {/* Warranty Page */}
      <section className="min-h-screen flex flex-col justify-center bg-white text-black p-8 print:page-break-after-always" style={{
      backgroundColor: pageLayouts?.warranty_background ? '#f8f9fa' : 'white'
    }}>
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <img src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/LOGO-CUBO/SIMBOLO-B.png" alt="Logo Cubo" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Garantia e Observações</h1>
          </header>

          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">🛡️ Garantia</h2>
              <p className="text-blue-800">
                {pageLayouts?.warranty_text || "Garantia de 1 ano para equipamentos e serviços executados pela Cubo Automação, " + "conforme termos e condições estabelecidos em contrato."}
              </p>
            </div>

            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-semibold text-gray-900">Observações Importantes:</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li>Os valores apresentados são válidos por 30 dias a partir da data de emissão desta proposta.</li>
                <li>Os equipamentos e materiais especificados seguem as normas técnicas vigentes.</li>
                <li>A execução dos serviços será realizada por profissionais qualificados.</li>
                <li>Eventuais alterações no projeto podem impactar nos valores finais.</li>
                <li>O cliente deve fornecer acesso adequado para execução dos serviços.</li>
              </ul>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Esta proposta não constitui contrato. 
                  Os serviços serão executados mediante assinatura de contrato específico.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Page */}
      <section className="min-h-screen flex flex-col justify-center text-white p-8" style={{
      backgroundImage: pageLayouts?.closing_background ? 'url(https://reugilk.s3.us-east-2.amazonaws.com/cubo/fundo-2.jpg)' : 'none',
      backgroundColor: pageLayouts?.closing_background ? 'transparent' : '#000'
    }}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <img src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/LOGO-CUBO/SIMBOLO-B.png" alt="Logo Cubo" className="w-20 h-20 mx-auto mb-6" />
          
          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg mb-8">
            <h1 className="text-2xl font-bold mb-6">Detalhamento por Ambiente</h1>
            
            <div className="space-y-4 text-sm mb-6">
              {environments.map(env => <div key={env.id} className="bg-white/5 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{env.name}</h3>
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between">
                      <span>Itens:</span>
                      <span>{formatCurrency(env.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mão de obra:</span>
                      <span>{formatCurrency(calculateEnvironmentLabor(env))}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(env.subtotal + calculateEnvironmentLabor(env))}</span>
                    </div>
                  </div>
                </div>)}
            </div>

            <div className="border-t-2 border-white/20 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total do Projeto:</span>
                <span className="text-3xl font-bold text-green-400">
                  {formatCurrency(environments.reduce((sum, env) => sum + env.subtotal + calculateEnvironmentLabor(env), 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">💳 Formas de Pagamento</h2>
              <div className="text-sm text-left space-y-2">
                {(pageLayouts?.payment_methods || settings?.payment_terms || "Pagamento à vista com desconto de 5%. Parcelamento em até 12x no cartão.").split('.').map((line, index) => line.trim() && <p key={index}>• {line.trim()}</p>)}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">📞 Contato</h2>
              <div className="text-sm text-left space-y-1">
                <p><strong>Cubo Automação</strong></p>
                <p>📧 contato@cubocasainteligente.com.br</p>
                <p>📱 (44) 98407-1331</p>
                <p>🌐 www.cubocasainteligente.com.br</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg">
              {pageLayouts?.closing_text || "Obrigado pela confiança! Estamos à disposição para esclarecimentos."}
            </p>
            <p className="text-sm opacity-75 mt-4">
              São Paulo, {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
      </section>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
      __html: `
          @media print {
            body { 
              margin: 0 !important; 
              padding: 0 !important; 
              font-size: 12pt !important; 
              line-height: 1.3 !important;
            }
            .print\\:page-break-after-always { 
              page-break-after: always !important; 
            }
            .print\\:hidden { 
              display: none !important; 
            }
            section {
              width: 100% !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 8px !important;
              box-sizing: border-box !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        `
    }} />
    </div>;
};
export default ProposalPage;