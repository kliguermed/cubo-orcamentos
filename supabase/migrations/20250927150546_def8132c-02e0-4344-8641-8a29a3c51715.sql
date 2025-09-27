-- Comprehensive fix for environment subtotals
-- This migration ensures all environment subtotals are correctly calculated

-- First, update all environment subtotals to be the sum of their items subtotals only
UPDATE environments 
SET subtotal = COALESCE((
  SELECT SUM(items.subtotal) 
  FROM items 
  WHERE items.environment_id = environments.id
), 0),
updated_at = now();

-- Update the trigger function to ensure it always calculates correctly
CREATE OR REPLACE FUNCTION public.update_environment_subtotal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Always update the subtotal of the environment based on the sum of items subtotals
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
$function$;

-- Ensure the trigger exists for items table
DROP TRIGGER IF EXISTS update_environment_subtotal_trigger ON items;
CREATE TRIGGER update_environment_subtotal_trigger
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_environment_subtotal();