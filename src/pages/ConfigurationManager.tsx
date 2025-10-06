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
import { ArrowLeft, Plus, Edit, Trash2, Image as ImageIcon, Save } from 'lucide-react';
import { ProposalFormattingTab } from '@/components/ProposalFormatting/ProposalFormattingTab';

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

const ConfigurationManager: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentTemplate[]>([]);
  const [pageLayouts, setPageLayouts] = useState<PageLayouts>({
    service_scope: "Instalação completa de automação residencial com materiais de primeira qualidade e mão de obra especializada.",
    payment_methods: "Pagamento à vista com desconto de 5%. Parcelamento em até 12x no cartão de crédito.",
    cover_title: "Proposta Comercial - Automação Residencial",
    cover_background: true,
    warranty_text: "Garantia de 12 meses para todos os equipamentos e serviços prestados, conforme termo de garantia em anexo.",
    warranty_background: false,
    closing_text: "Agradecemos a oportunidade de apresentar nossa proposta. Estamos à disposição para quaisquer esclarecimentos.",
    closing_background: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    loadPageLayouts();
  }, []);

  const loadPageLayouts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('page_layouts')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading page layouts:', error);
        return;
      }

      if (data) {
        setPageLayouts({
          service_scope: data.service_scope || pageLayouts.service_scope,
          payment_methods: data.payment_methods || pageLayouts.payment_methods,
          cover_title: data.cover_title || pageLayouts.cover_title,
          cover_background: data.cover_background ?? pageLayouts.cover_background,
          warranty_text: data.warranty_text || pageLayouts.warranty_text,
          warranty_background: data.warranty_background ?? pageLayouts.warranty_background,
          closing_text: data.closing_text || pageLayouts.closing_text,
          closing_background: data.closing_background ?? pageLayouts.closing_background,
        });
      }
    } catch (error) {
      console.error('Error loading page layouts:', error);
    }
  };

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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('environment_templates')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading environments:', error);
        return;
      }

      const mappedEnvironments: EnvironmentTemplate[] = (data || []).map(env => ({
        id: env.id,
        name: env.name,
        description: env.description || '',
        background_image: env.background_image_url || '',
        html_content: env.html_content || '',
      }));

      setEnvironments(mappedEnvironments);
    } catch (error) {
      console.error('Error loading environments:', error);
    }
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

  const handleSaveEnvironment = async () => {
    if (!envName) {
      toast({
        title: "Erro",
        description: "Nome do ambiente é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const envData = {
        user_id: session.user.id,
        name: envName,
        description: envDescription,
        html_content: envHtmlContent,
      };

      if (editingEnvironment) {
        const { error } = await supabase
          .from('environment_templates')
          .update(envData)
          .eq('id', editingEnvironment.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('environment_templates')
          .insert([envData]);

        if (error) throw error;
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

      // Reload environments
      await loadEnvironments();
    } catch (error: any) {
      console.error('Error saving environment:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar ambiente.",
        variant: "destructive",
      });
    }
  };

  const handleEditEnvironment = (env: EnvironmentTemplate) => {
    setEditingEnvironment(env);
    setEnvName(env.name);
    setEnvDescription(env.description);
    setEnvHtmlContent(env.html_content || '');
    setShowEnvironmentForm(true);
  };

  const handleDeleteEnvironment = async (envId: string) => {
    try {
      const { error } = await supabase
        .from('environment_templates')
        .delete()
        .eq('id', envId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ambiente excluído!",
      });

      // Reload environments
      await loadEnvironments();
    } catch (error: any) {
      console.error('Error deleting environment:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir ambiente.",
        variant: "destructive",
      });
    }
  };

  const handleSavePageLayouts = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const layoutData = {
        user_id: session.user.id,
        service_scope: pageLayouts.service_scope,
        payment_methods: pageLayouts.payment_methods,
        cover_title: pageLayouts.cover_title,
        cover_background: pageLayouts.cover_background,
        warranty_text: pageLayouts.warranty_text,
        warranty_background: pageLayouts.warranty_background,
        closing_text: pageLayouts.closing_text,
        closing_background: pageLayouts.closing_background,
      };

      const { error } = await supabase
        .from('page_layouts')
        .upsert([layoutData], {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações de layout foram salvas com sucesso",
      });
    } catch (error: any) {
      console.error('Error saving page layouts:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calculation">Regras de Cálculo</TabsTrigger>
            <TabsTrigger value="environments">Ambientes</TabsTrigger>
            <TabsTrigger value="pages">Paginações</TabsTrigger>
            <TabsTrigger value="formatting">Formatação</TabsTrigger>
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
            <div className="grid gap-6">
              {/* Escopo de Serviço */}
              <Card>
                <CardHeader>
                  <CardTitle>Escopo de Serviço</CardTitle>
                  <CardDescription>Configure o texto do escopo que aparece na proposta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Label htmlFor="service-scope">Texto do Escopo de Serviço</Label>
                  <Textarea
                    id="service-scope"
                    rows={4}
                    value={pageLayouts.service_scope}
                    onChange={(e) => setPageLayouts(prev => ({ ...prev, service_scope: e.target.value }))}
                    placeholder="Digite aqui o texto do escopo de serviço..."
                  />
                </CardContent>
              </Card>

              {/* Formas de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Formas de Pagamento</CardTitle>
                  <CardDescription>Configure o texto das condições de pagamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Label htmlFor="payment-methods">Texto das Formas de Pagamento</Label>
                  <Textarea
                    id="payment-methods"
                    rows={3}
                    value={pageLayouts.payment_methods}
                    onChange={(e) => setPageLayouts(prev => ({ ...prev, payment_methods: e.target.value }))}
                    placeholder="Digite aqui as formas de pagamento..."
                  />
                </CardContent>
              </Card>

              {/* Capa Principal */}
              <Card>
                <CardHeader>
                  <CardTitle>Capa Principal</CardTitle>
                  <CardDescription>Configure o layout da capa principal da proposta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cover-background"
                      checked={pageLayouts.cover_background}
                      onChange={(e) => setPageLayouts(prev => ({ ...prev, cover_background: e.target.checked }))}
                    />
                    <Label htmlFor="cover-background">Usar fundo personalizado na capa</Label>
                  </div>
                  <Label htmlFor="cover-title">Título da Capa</Label>
                  <Input
                    id="cover-title"
                    value={pageLayouts.cover_title}
                    onChange={(e) => setPageLayouts(prev => ({ ...prev, cover_title: e.target.value }))}
                    placeholder="Digite o título da capa..."
                  />
                </CardContent>
              </Card>

              {/* Garantia */}
              <Card>
                <CardHeader>
                  <CardTitle>Garantia</CardTitle>
                  <CardDescription>Configure o conteúdo da página de garantia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Label htmlFor="warranty-text">Texto da Garantia</Label>
                  <Textarea
                    id="warranty-text"
                    rows={4}
                    value={pageLayouts.warranty_text}
                    onChange={(e) => setPageLayouts(prev => ({ ...prev, warranty_text: e.target.value }))}
                    placeholder="Digite aqui o texto da garantia..."
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="warranty-background"
                      checked={pageLayouts.warranty_background}
                      onChange={(e) => setPageLayouts(prev => ({ ...prev, warranty_background: e.target.checked }))}
                    />
                    <Label htmlFor="warranty-background">Usar fundo personalizado na garantia</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Página de Fechamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Página de Fechamento</CardTitle>
                  <CardDescription>Configure o layout da página final da proposta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Label htmlFor="closing-text">Texto de Fechamento</Label>
                  <Textarea
                    id="closing-text"
                    rows={3}
                    value={pageLayouts.closing_text}
                    onChange={(e) => setPageLayouts(prev => ({ ...prev, closing_text: e.target.value }))}
                    placeholder="Digite aqui o texto de fechamento..."
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="closing-background"
                      checked={pageLayouts.closing_background}
                      onChange={(e) => setPageLayouts(prev => ({ ...prev, closing_background: e.target.checked }))}
                    />
                    <Label htmlFor="closing-background">Usar fundo personalizado no fechamento</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Salvar Configurações de Layout */}
              <div className="flex justify-end">
                <Button onClick={handleSavePageLayouts} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Configurações de Layout"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formatting" className="space-y-6">
            <ProposalFormattingTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ConfigurationManager;