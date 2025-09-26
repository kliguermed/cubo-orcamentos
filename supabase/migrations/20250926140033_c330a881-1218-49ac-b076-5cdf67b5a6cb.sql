-- Primeiro, atualizar os subtotais dos ambientes para os valores corretos
UPDATE environments 
SET subtotal = COALESCE((
  SELECT SUM(i.subtotal) 
  FROM items i 
  WHERE i.environment_id = environments.id
), 0),
updated_at = now()
WHERE budget_id = '54d8fd1b-ad47-43eb-a1b2-28d39b8e8739';

-- Criar função para recalcular subtotal de um ambiente
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar subtotal do ambiente quando itens são inseridos, atualizados ou deletados
DROP TRIGGER IF EXISTS trigger_update_environment_subtotal ON items;
CREATE TRIGGER trigger_update_environment_subtotal
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_environment_subtotal();

-- Recalcular todos os subtotais dos ambientes para garantir consistência
UPDATE environments 
SET subtotal = COALESCE((
  SELECT SUM(i.subtotal) 
  FROM items i 
  WHERE i.environment_id = environments.id
), 0),
updated_at = now();