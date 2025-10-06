// Helper functions for BudgetEditor - templates loading
import { supabase } from "@/integrations/supabase/client";
import { EnvironmentTemplate } from "@/types/assetLibrary";

export const loadTemplates = async (): Promise<EnvironmentTemplate[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('environment_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      user_id: t.user_id,
      name: t.name,
      description: t.description || '',
      html_content: t.html_content || '',
      background_image_url: t.background_image_url || '',
      image_library: (t.image_library as any) || [],
      default_image_url: t.default_image_url || undefined,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
};

export const createEnvironmentFromTemplate = async (
  budgetId: string,
  templateName: string,
  templateId?: string
): Promise<string | null> => {
  try {
    let coverUrl: string | undefined;
    
    if (templateId) {
      const { data: template } = await supabase
        .from('environment_templates')
        .select('default_image_url')
        .eq('id', templateId)
        .maybeSingle();
      
      coverUrl = template?.default_image_url || undefined;
    }

    const { data, error } = await supabase
      .from('environments')
      .insert([{
        budget_id: budgetId,
        name: templateName,
        template_id: templateId || null,
        cover_image_url: coverUrl || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating environment:', error);
    return null;
  }
};
