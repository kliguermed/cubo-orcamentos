import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';

interface Settings {
  id: string;
  user_id: string;
  labor_type: "fixed" | "percentage";
  labor_value: number;
  rt_type: "fixed" | "percentage";
  rt_value: number;
  markup_percentage: number;
  rt_distribution: "diluted" | "separate";
  payment_terms: string;
  created_at?: string;
  updated_at?: string;
}

interface EnvironmentTemplate {
  id: string;
  name: string;
  description: string;
  background_image?: string;
  html_content?: string;
}

const ConfigurationManager: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calculation');

  // Form states for calculation rules
  const [laborType, setLaborType] = useState<"fixed" | "percentage">("percentage");
  const [laborValue, setLaborValue] = useState('');
  const [rtType, setRtType] = useState<"fixed" | "percentage">("percentage");
  const [rtValue, setRtValue] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState('');
  const [rtDistribution, setRtDistribution] = useState<"diluted" | "separate">("diluted"); 
  const [paymentTerms, setPaymentTerms] = useState('');

  // Environment form states
  const [showEnvironmentForm, setShowEnvironmentForm] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<EnvironmentTemplate | null>(null);
  const [envName, setEnvName] = useState('');
  const [envDescription, setEnvDescription] = useState('');
  const [envHtmlContent, setEnvHtmlContent] = useState('');

  useEffect(() => {
    loadSettings();
    loadEnvironments();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        const mappedSettings: Settings = {
          id: data.id,
          user_id: data.user_id,
          labor_type: data.labor_type as "fixed" | "percentage",
          labor_value: data.labor_value,
          rt_type: data.rt_type as "fixed" | "percentage", 
          rt_value: data.rt_value,
          markup_percentage: data.markup_percentage,
          rt_distribution: data.rt_distribution as "diluted" | "separate",
          payment_terms: data.payment_terms,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        
        setSettings(mappedSettings);
        setLaborType(mappedSettings.labor_type);
        setLaborValue(mappedSettings.labor_value.toString());
        setRtType(mappedSettings.rt_type);
        setRtValue(mappedSettings.rt_value.toString());
        setMarkupPercentage(mappedSettings.markup_percentage.toString());
        setRtDistribution(mappedSettings.rt_distribution);
        setPaymentTerms(mappedSettings.payment_terms);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnvironments = async () => {
    // For now, we'll use mock data since we need to create the environment_templates table
    setEnvironments([
      { id: '1', name: 'Cozinha', description: 'Ambiente da cozinha residencial', html_content: '' },
      { id: '2', name: 'Sala de Estar', description: 'Ambiente da sala de estar', html_content: '' },
      { id: '3', name: 'Quarto', description: 'Ambiente do quarto', html_content: '' },
    ]);
  };

  const saveSettings = async () => {
    if (!laborValue || !rtValue || !markupPercentage) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const settingsData = {
        user_id: session.user.id,
        labor_type: laborType,
        labor_value: parseFloat(laborValue),
        rt_type: rtType,
        rt_value: parseFloat(rtValue),
        markup_percentage: parseFloat(markupPercentage),
        rt_distribution: rtDistribution,
        payment_terms: paymentTerms,
      };

      if (settings) {
        const { error } = await supabase
          .from('settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .upsert([settingsData], {
            onConflict: 'user_id'
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });

      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive",
      });
    }
  };

  const handleSaveEnvironment = () => {
    if (!envName) {
      toast({
        title: "Erro",
        description: "Nome do ambiente é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // For now, just update local state
    if (editingEnvironment) {
      setEnvironments(prev => prev.map(env => 
        env.id === editingEnvironment.id 
          ? { ...env, name: envName, description: envDescription, html_content: envHtmlContent }
          : env
      ));
    } else {
      const newEnv: EnvironmentTemplate = {
        id: Date.now().toString(),
        name: envName,
        description: envDescription,
        html_content: envHtmlContent,
      };
      setEnvironments(prev => [...prev, newEnv]);
    }

    setShowEnvironmentForm(false);
    setEditingEnvironment(null);
    setEnvName('');
    setEnvDescription('');
    setEnvHtmlContent('');

    toast({
      title: "Sucesso",
      description: editingEnvironment ? "Ambiente atualizado!" : "Ambiente criado!",
    });
  };

  const handleEditEnvironment = (env: EnvironmentTemplate) => {
    setEditingEnvironment(env);
    setEnvName(env.name);
    setEnvDescription(env.description);
    setEnvHtmlContent(env.html_content || '');
    setShowEnvironmentForm(true);
  };

  const handleDeleteEnvironment = (envId: string) => {
    setEnvironments(prev => prev.filter(env => env.id !== envId));
    toast({
      title: "Sucesso",
      description: "Ambiente excluído!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Carregando configurações...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Configurações do Sistema</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculation">Regras de Cálculo</TabsTrigger>
            <TabsTrigger value="environments">Ambientes</TabsTrigger>
            <TabsTrigger value="pages">Paginações</TabsTrigger>
          </TabsList>

          <TabsContent value="calculation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Cálculo</CardTitle>
                <CardDescription>
                  Configure os valores base para cálculos de orçamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="labor-type">Tipo de Mão de Obra</Label>
                    <select
                      id="labor-type"
                      value={laborType}
                      onChange={(e) => setLaborType(e.target.value as "fixed" | "percentage")}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="fixed">Valor Fixo (R$)</option>
                      <option value="percentage">Percentual (%)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="labor-value">
                      {laborType === "fixed" ? "Valor da Mão de Obra (R$)" : "Percentual de Mão de Obra (%)"}
                    </Label>
                    <Input
                      id="labor-value"
                      type="number"
                      value={laborValue}
                      onChange={(e) => setLaborValue(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rt-type">Tipo de Reserva Técnica</Label>
                    <select
                      id="rt-type"
                      value={rtType}
                      onChange={(e) => setRtType(e.target.value as "fixed" | "percentage")}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="fixed">Valor Fixo (R$)</option>
                      <option value="percentage">Percentual (%)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="rt-value">
                      {rtType === "fixed" ? "Valor da Reserva Técnica (R$)" : "Percentual de Reserva Técnica (%)"}
                    </Label>
                    <Input
                      id="rt-value"
                      type="number"
                      value={rtValue}
                      onChange={(e) => setRtValue(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="markup-percentage">Markup Lucro (%)</Label>
                    <Input
                      id="markup-percentage"
                      type="number"
                      value={markupPercentage}
                      onChange={(e) => setMarkupPercentage(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rt-distribution">Distribuição da RT</Label>
                    <select
                      id="rt-distribution"
                      value={rtDistribution}
                      onChange={(e) => setRtDistribution(e.target.value as "diluted" | "separate")}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="diluted">Diluída nos preços</option>
                      <option value="separate">Valor separado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment-terms">Condições de Pagamento</Label>
                  <Textarea
                    id="payment-terms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Descreva as condições de pagamento..."
                    rows={4}
                  />
                </div>

                <Button onClick={saveSettings} className="w-full">
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Ambientes</CardTitle>
                <CardDescription>
                  Configure templates de ambientes para usar nos orçamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Ambientes Configurados</h3>
                  <Button
                    onClick={() => setShowEnvironmentForm(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Ambiente</span>
                  </Button>
                </div>

                {showEnvironmentForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>
                        {editingEnvironment ? 'Editar Ambiente' : 'Novo Ambiente'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="env-name">Nome do Ambiente</Label>
                        <Input
                          id="env-name"
                          value={envName}
                          onChange={(e) => setEnvName(e.target.value)}
                          placeholder="Ex: Cozinha, Sala de Estar..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="env-description">Descrição</Label>
                        <Textarea
                          id="env-description"
                          value={envDescription}
                          onChange={(e) => setEnvDescription(e.target.value)}
                          placeholder="Descrição do ambiente..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="env-html">Conteúdo HTML Personalizado</Label>
                        <Textarea
                          id="env-html"
                          value={envHtmlContent}
                          onChange={(e) => setEnvHtmlContent(e.target.value)}
                          placeholder="<div>Conteúdo HTML personalizado...</div>"
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button onClick={handleSaveEnvironment}>
                          {editingEnvironment ? 'Atualizar' : 'Salvar'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowEnvironmentForm(false);
                            setEditingEnvironment(null);
                            setEnvName('');
                            setEnvDescription('');
                            setEnvHtmlContent('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {environments.map((env) => (
                    <Card key={env.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{env.name}</CardTitle>
                        <CardDescription>{env.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEnvironment(env)}
                            className="flex items-center space-x-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Editar</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEnvironment(env.id)}
                            className="flex items-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Excluir</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Paginações</CardTitle>
                <CardDescription>
                  Personalize o layout e formatação das páginas da proposta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Capa Principal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure o layout da capa da proposta
                        </p>
                        <Button variant="outline" className="w-full">
                          Configurar Capa
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Garantia</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure a página de garantia
                        </p>
                        <Button variant="outline" className="w-full">
                          Configurar Garantia
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Página de Fechamento</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure a página final da proposta
                        </p>
                        <Button variant="outline" className="w-full">
                          Configurar Fechamento
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Discriminação de Itens</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure o layout das tabelas de itens
                        </p>
                        <Button variant="outline" className="w-full">
                          Configurar Layout
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Configurações Globais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="service-scope">Texto do Escopo de Serviço</Label>
                        <Textarea
                          id="service-scope"
                          placeholder="Descreva o escopo padrão dos serviços..."
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label htmlFor="payment-methods">Formas de Pagamento</Label>
                        <Textarea
                          id="payment-methods"
                          placeholder="Descreva as formas de pagamento aceitas..."
                          rows={3}
                        />
                      </div>

                      <Button className="w-full">
                        Salvar Configurações de Página
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ConfigurationManager;