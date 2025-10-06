import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Asset } from '@/types/assetLibrary';

interface Environment {
  id: string;
  name: string;
  cover_image_url?: string;
}

const ProposalPreview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const budgetId = searchParams.get('budgetId');
  
  const [mainCoverAsset, setMainCoverAsset] = useState<Asset | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [budgetName, setBudgetName] = useState<string>('');

  useEffect(() => {
    loadMainCover();
    if (budgetId) {
      loadBudgetData();
    }
  }, [budgetId]);

  const loadBudgetData = async () => {
    if (!budgetId) return;

    try {
      const { data: budget } = await supabase
        .from('budgets')
        .select('client_name')
        .eq('id', budgetId)
        .maybeSingle();

      if (budget) {
        setBudgetName(budget.client_name);
      }

      const { data: envs } = await supabase
        .from('environments')
        .select('id, name, cover_image_url')
        .eq('budget_id', budgetId)
        .order('created_at');

      setEnvironments(envs || []);
    } catch (error) {
      console.error('Erro ao carregar dados do orçamento:', error);
    }
  };

  const loadMainCover = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from('proposal_template_settings')
        .select('main_cover_asset_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings?.main_cover_asset_id) {
        const { data: asset } = await supabase
          .from('assets')
          .select('*')
          .eq('id', settings.main_cover_asset_id)
          .maybeSingle();

        setMainCoverAsset(asset);
      }
    } catch (error) {
      console.error('Erro ao carregar capa:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 bg-card border-b z-50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => budgetId ? navigate(`/budget/${budgetId}`) : navigate('/configuration-manager')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {budgetId ? 'Voltar ao Orçamento' : 'Voltar para Configurações'}
          </Button>
          <h1 className="text-xl font-semibold">
            {budgetId ? `Preview - ${budgetName || 'Proposta'}` : 'Preview da Proposta'}
          </h1>
          <div className="w-32" /> {/* Spacer para centralizar título */}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Capa Principal */}
          <div className="relative aspect-[8.5/11] rounded-lg overflow-hidden shadow-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-8">
            {mainCoverAsset ? (
              <img
                src={mainCoverAsset.url}
                alt="Capa da proposta"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg mb-2">Nenhuma imagem de capa definida</p>
                  <p className="text-sm">Configure uma imagem na aba Formatação</p>
                </div>
              </div>
            )}

            {/* Overlay com informações */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-12">
              <div className="text-white">
                <h2 className="text-5xl font-bold mb-4">
                  {budgetId ? `Proposta para ${budgetName || 'Cliente'}` : 'Proposta Comercial'}
                </h2>
                <p className="text-xl mb-2">Automação Residencial Premium</p>
                <p className="text-lg opacity-90">
                  {new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Ambientes (se tiver budgetId) */}
          {budgetId && environments.length > 0 && (
            <div className="space-y-6 mb-8">
              <h3 className="text-2xl font-semibold">Ambientes</h3>
              <div className="grid grid-cols-2 gap-4">
                {environments.map((env) => (
                  <div key={env.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      {env.cover_image_url ? (
                        <img
                          src={env.cover_image_url}
                          alt={env.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          Sem capa
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold">{env.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações sobre a funcionalidade */}
          <div className="bg-card rounded-lg border p-8 space-y-4">
            <h3 className="text-2xl font-semibold mb-4">Como funciona?</h3>
            
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Capa Principal:</strong> A imagem que você
                configurou será usada como capa de todas as suas propostas.
              </p>
              
              <p>
                <strong className="text-foreground">Ambientes Automáticos:</strong> Quando você
                criar um ambiente com nome que corresponda a um vínculo (ex: "Sala de Estar"), a
                imagem configurada será aplicada automaticamente.
              </p>
              
              <p>
                <strong className="text-foreground">Imagem Padrão:</strong> Se um ambiente não
                tiver um vínculo específico, a imagem padrão será usada automaticamente.
              </p>
            </div>

            <div className="pt-4 border-t mt-6">
              <Button
                onClick={() => budgetId ? navigate(`/budget/${budgetId}`) : navigate('/configuration-manager')}
                size="lg"
                className="w-full"
              >
                {budgetId ? 'Voltar ao Orçamento' : 'Voltar e Configurar Formatação'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProposalPreview;
