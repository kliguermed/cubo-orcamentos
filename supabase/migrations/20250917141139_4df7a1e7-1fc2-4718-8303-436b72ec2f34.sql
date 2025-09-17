-- Create environment_templates table for storing custom environment configurations
CREATE TABLE public.environment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  background_image_url TEXT,
  html_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.environment_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for environment_templates
CREATE POLICY "Users can manage their own environment templates" 
ON public.environment_templates 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create page_layouts table for storing pagination/layout configurations
CREATE TABLE public.page_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_scope TEXT,
  payment_methods TEXT,
  cover_title TEXT,
  cover_background BOOLEAN DEFAULT true,
  warranty_text TEXT,
  warranty_background BOOLEAN DEFAULT false,
  closing_text TEXT,
  closing_background BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies for page_layouts
CREATE POLICY "Users can manage their own page layouts" 
ON public.page_layouts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on environment_templates
CREATE TRIGGER update_environment_templates_updated_at
BEFORE UPDATE ON public.environment_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on page_layouts
CREATE TRIGGER update_page_layouts_updated_at
BEFORE UPDATE ON public.page_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();