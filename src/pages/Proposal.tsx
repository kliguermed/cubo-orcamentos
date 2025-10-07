import { useState, useEffect } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface PageLayouts {
  service_scope: string;
  payment_methods: string;
  cover_title: string;
  cover_background: boolean;
  warranty_text: string;
  warranty_background: boolean;
  closing_text: string;
  closing_background: boolean;
}

const Proposal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pageLayouts, setPageLayouts] = useState<PageLayouts | null>(null);
  const [mainCoverUrl, setMainCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProposalData();
    }
  }, [id]);

  const fetchProposalData = async () => {
    try {
      const budgetRes = await supabase.from("budgets").select("*").eq("id", id).single();
      if (budgetRes.error) throw budgetRes.error;
      setBudget(budgetRes.data as Budget);

      // Agora buscar settings e layouts com user_id correto
      const [envRes, settingsRes, layoutsRes] = await Promise.all([
        supabase.from("environments").select(`*, items (*)`).eq("budget_id", id),
        supabase.from("settings").select("*").eq("user_id", budgetRes.data.user_id).single(),
        supabase.from("page_layouts").select("*").eq("user_id", budgetRes.data.user_id).single(),
      ]);

      if (budgetRes.error) throw budgetRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setBudget(budgetRes.data as Budget);
      setEnvironments(envRes.data || []);
      setSettings(settingsRes.data);
      setPageLayouts(layoutsRes.data || null);

      // Fetch main cover from proposal template settings
      const { data: templateSettings } = await supabase
        .from("proposal_template_settings")
        .select("main_cover_asset_id")
        .eq("user_id", budgetRes.data.user_id)
        .maybeSingle();

      // If there's a main cover asset configured, fetch its URL
      if (templateSettings?.main_cover_asset_id) {
        const { data: assetData } = await supabase
          .from("assets")
          .select("url")
          .eq("id", templateSettings.main_cover_asset_id)
          .maybeSingle();

        if (assetData) {
          setMainCoverUrl(assetData.url);
        }
      }
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

  const calculateEnvironmentLabor = (env: Environment) => {
    if (!settings) return 0;

    const totalQuantity = env.items.reduce((sum, item) => sum + item.quantity, 0);
    return settings.labor_value * totalQuantity;
  };

  const calculateTotals = () => {
    const subtotalItems = environments.reduce(
      (sum, env) => sum + env.items.reduce((envSum, item) => envSum + item.subtotal, 0),
      0,
    );

    let totalLaborCost = 0;
    let rtCost = 0;

    if (settings) {
      // Calculate total labor cost (sum of all environments)
      totalLaborCost = environments.reduce((sum, env) => sum + calculateEnvironmentLabor(env), 0);

      // Calculate RT cost (only if separate)
      if (settings.rt_distribution === "separate") {
        if (settings.rt_type === "fixed") {
          rtCost = settings.rt_value;
        } else if (settings.rt_type === "percentage") {
          rtCost = (subtotalItems + totalLaborCost) * (settings.rt_value / 100);
        }
      }
    }

    const total = subtotalItems + totalLaborCost + rtCost;

    return {
      subtotalItems,
      laborCost: totalLaborCost,
      rtCost,
      total,
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
      <main className="print:px-0 print:py-0">
        <div className="bg-white print:bg-transparent print:shadow-none">
          {/* Main Cover Page */}
          <section
            className="h-screen text-white flex flex-col justify-center items-center text-center relative bg-cover bg-center print:break-after-page"
            style={{
              backgroundImage: mainCoverUrl
                ? `url(${mainCoverUrl})`
                : "url(https://reugilk.s3.us-east-2.amazonaws.com/cubo/fundo-2.jpg)",
            }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10">
              <img
                src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/LOGO-CUBO/SIMBOLO-B.png"
                alt="Logo"
                className="w-24 h-auto mx-auto mb-5"
              />
              <h1 className="text-4xl font-bold mb-3">{pageLayouts?.cover_title || "Proposta Comercial"}</h1>
              <p className="text-xl mb-2">
                <strong>Cliente:</strong> {budget.client_name}
              </p>
              <p className="text-lg">{formatDate(budget.created_at)}</p>
            </div>
          </section>

          {/* Environment Pages */}
          {environments.map((env, index) => (
            <div key={env.id}>
              {/* Environment Cover Page */}
              <section
                className="h-screen text-white flex flex-col justify-center items-center text-center relative bg-cover bg-center print:break-after-page"
                style={{
                  backgroundImage: `url(${index % 2 === 0 ? "https://reugilk.s3.us-east-2.amazonaws.com/cubo/fundo-2.jpg" : "https://reugilk.s3.us-east-2.amazonaws.com/cubo/Showroom-Cubo/foto008.jpg"})`,
                }}
              >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10">
                  <img
                    src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/LOGO-CUBO/SIMBOLO-B.png"
                    alt="Logo"
                    className="w-24 h-auto mx-auto mb-5"
                  />
                  <h1 className="text-4xl font-bold mb-3">{env.name}</h1>
                  <p className="text-lg">{formatDate(budget.created_at)}</p>
                </div>
              </section>

              {/* Environment Content Page */}
              <section className="p-8 max-w-4xl mx-auto print:break-after-page">
                {env.description && <p className="text-lg text-gray-700 mb-8 leading-relaxed">{env.description}</p>}

                {/* Items as Cards */}
                <div className="space-y-4 mb-8">
                  {env.items.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.name}</h3>
                      <div className="text-gray-600">
                        <p className="mb-1">Qtd: {item.quantity.toString().replace(".00", "")}</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Environment Total */}
                <div className="bg-gray-900 text-white p-6 rounded-lg text-center">
                  <p className="text-xl font-bold">
                    Total {env.name}:{" "}
                    {formatCurrency(
                      env.items.reduce((sum, item) => sum + item.subtotal, 0) + calculateEnvironmentLabor(env),
                    )}
                  </p>
                </div>
              </section>
            </div>
          ))}

          {/* Warranty/Observations Page */}
          <section className="p-16 text-center print:break-after-page bg-gray-50">
            <img
              src="https://reugilk.s3.us-east-2.amazonaws.com/cubo/cubo-garantia.png"
              alt="Logo Cubo Casa Inteligente"
              className="max-w-40 mx-auto mb-8"
            />

            <div className="max-w-3xl mx-auto space-y-6 text-gray-700 leading-relaxed">
              <p>
                Após a confirmação da proposta, será enviado um contrato de prestação de serviços para confirmação de
                ambas as partes. Neste, também constarão todos os valores, garantias e prazos estabelecidos.
              </p>

              <p>
                Em seguida, realizamos os investimentos necessários em equipamentos estipulados anteriormente em
                contrato.
              </p>

              <p>
                {pageLayouts?.warranty_text ||
                  "Todos produtos utilizados em nossas instalações contam com 1 ano de garantia e 1 ano de garantia na prestação de serviço."}
              </p>

              <p>
                Após a realização do trabalho, ficaremos disponíveis por até 60 dias para esclarecimento de dúvidas,
                ajustes e criação de cenas extras, caso necessário.
              </p>

              <p>
                <strong>OBS:</strong> O pagamento dos cabos de rede deverá ser realizado após instalação e finalização
                do projeto, de acordo com a metragem utilizada.
              </p>

              <p className="text-sm text-gray-500 mt-8">@cubocasainteligente</p>
            </div>
          </section>

          {/* Final Page - Payment and Contact */}
          <section className="p-8 text-center bg-gray-100 min-h-screen flex flex-col justify-center">
            <div className="max-w-2xl mx-auto">
              {/* Total do Projeto */}
              <div className="bg-primary/10 border-2 border-primary/20 p-8 rounded-lg text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-700 mb-4">VALOR TOTAL DO PROJETO</h3>
                <div className="text-4xl font-bold text-primary mb-4">{formatCurrency(totals.total)}</div>
                <p className="text-gray-600">Inclui todos os itens e mão de obra</p>
              </div>

              {/* Payment Terms */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Forma de Pagamento:</h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {pageLayouts?.payment_methods ||
                    settings.payment_terms ||
                    "Pix com 5% desconto\nEntrada 50%\nSaldo até 6x no cartão"}
                </div>
              </div>

              {/* Contact Information */}
              <div className="text-gray-600">
                <p>Contato: contato@cubocasainteligente.com.br</p>
                <p>+55 (44) 9 8407-1331</p>
                <p className="mt-4">Umuarama - PR, {formatDate(budget.created_at)}</p>
              </div>

              {/* Closing Text */}
              {pageLayouts?.closing_text && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-700 italic">{pageLayouts.closing_text}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Proposal;
