import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SettingsData {
  labor_type: "fixed" | "percentage";
  labor_value: number;
  rt_type: "fixed" | "percentage";
  rt_value: number;
  markup_percentage: number;
  rt_distribution: "diluted" | "separate";
  payment_terms: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    labor_type: "percentage",
    labor_value: 0,
    rt_type: "percentage", 
    rt_value: 0,
    markup_percentage: 0,
    rt_distribution: "diluted",
    payment_terms: "Pagamento à vista com desconto de 5%. Parcelamento em até 12x no cartão.",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          labor_type: data.labor_type as "fixed" | "percentage",
          labor_value: parseFloat(data.labor_value.toString()) || 0,
          rt_type: data.rt_type as "fixed" | "percentage",
          rt_value: parseFloat(data.rt_value.toString()) || 0,
          markup_percentage: parseFloat(data.markup_percentage.toString()) || 0,
          rt_distribution: data.rt_distribution as "diluted" | "separate",
          payment_terms: data.payment_terms || settings.payment_terms,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          user_id: user?.id,
          ...settings,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configurações",
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Configure as regras de cálculo</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Mão de Obra */}
          <Card>
            <CardHeader>
              <CardTitle>Mão de Obra</CardTitle>
              <CardDescription>
                Configure como a mão de obra será calculada nos orçamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={settings.labor_type}
                onValueChange={(value: "fixed" | "percentage") =>
                  setSettings(prev => ({ ...prev, labor_type: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="labor-fixed" />
                  <Label htmlFor="labor-fixed">Valor fixo (R$)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="labor-percentage" />
                  <Label htmlFor="labor-percentage">Percentual (%)</Label>
                </div>
              </RadioGroup>
              
              <div>
                <Label htmlFor="labor-value">
                  {settings.labor_type === "fixed" ? "Valor (R$)" : "Percentual (%)"}
                </Label>
                <Input
                  id="labor-value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.labor_value}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, labor_value: parseFloat(e.target.value) || 0 }))
                  }
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </CardContent>
          </Card>

          {/* RT */}
          <Card>
            <CardHeader>
              <CardTitle>RT (Responsabilidade Técnica)</CardTitle>
              <CardDescription>
                Configure como a RT será calculada nos orçamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={settings.rt_type}
                onValueChange={(value: "fixed" | "percentage") =>
                  setSettings(prev => ({ ...prev, rt_type: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="rt-fixed" />
                  <Label htmlFor="rt-fixed">Valor fixo (R$)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="rt-percentage" />
                  <Label htmlFor="rt-percentage">Percentual (%)</Label>
                </div>
              </RadioGroup>
              
              <div>
                <Label htmlFor="rt-value">
                  {settings.rt_type === "fixed" ? "Valor (R$)" : "Percentual (%)"}
                </Label>
                <Input
                  id="rt-value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.rt_value}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, rt_value: parseFloat(e.target.value) || 0 }))
                  }
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div>
                <Label>Forma de apresentação da RT</Label>
                <RadioGroup
                  value={settings.rt_distribution}
                  onValueChange={(value: "diluted" | "separate") =>
                    setSettings(prev => ({ ...prev, rt_distribution: value }))
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="diluted" id="rt-diluted" />
                    <Label htmlFor="rt-diluted">Diluída nos preços dos itens</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="separate" id="rt-separate" />
                    <Label htmlFor="rt-separate">Valor separado no resumo</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Markup */}
          <Card>
            <CardHeader>
              <CardTitle>Lucro / Markup</CardTitle>
              <CardDescription>
                Percentual de lucro aplicado sobre os itens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="markup">Percentual de lucro (%)</Label>
              <Input
                id="markup"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.markup_percentage}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, markup_percentage: parseFloat(e.target.value) || 0 }))
                }
                onFocus={(e) => e.target.select()}
              />
            </CardContent>
          </Card>

          {/* Condições de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Condições de Pagamento</CardTitle>
              <CardDescription>
                Texto que aparecerá no rodapé das propostas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="payment-terms">Condições de pagamento</Label>
              <Textarea
                id="payment-terms"
                rows={3}
                value={settings.payment_terms}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, payment_terms: e.target.value }))
                }
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;