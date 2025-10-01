-- Create a function to calculate item subtotal automatically
CREATE OR REPLACE FUNCTION public.calculate_item_subtotal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Calculate subtotal as quantity * sale_price
  NEW.subtotal = NEW.quantity * NEW.sale_price;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically calculate item subtotal on INSERT or UPDATE
DROP TRIGGER IF EXISTS trigger_calculate_item_subtotal ON public.items;
CREATE TRIGGER trigger_calculate_item_subtotal
  BEFORE INSERT OR UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_item_subtotal();