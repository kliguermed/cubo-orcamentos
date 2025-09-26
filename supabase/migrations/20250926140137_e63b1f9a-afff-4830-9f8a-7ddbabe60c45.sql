-- Corrigir a função para usar SET search_path corretamente
CREATE OR REPLACE FUNCTION public.update_environment_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o subtotal do ambiente baseado na soma dos subtotais dos itens
  UPDATE environments 
  SET subtotal = COALESCE((
    SELECT SUM(subtotal) 
    FROM items 
    WHERE environment_id = COALESCE(NEW.environment_id, OLD.environment_id)
  ), 0),
  updated_at = now()
  WHERE id = COALESCE(NEW.environment_id, OLD.environment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;