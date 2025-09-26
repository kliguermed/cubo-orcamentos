-- Fix existing environment subtotals to contain only items total (not labor)
-- This corrects the data where subtotal was incorrectly saved with labor included

-- Update environments subtotal to be the sum of their items subtotals only
UPDATE environments 
SET subtotal = COALESCE((
  SELECT SUM(items.subtotal) 
  FROM items 
  WHERE items.environment_id = environments.id
), 0),
updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM items WHERE items.environment_id = environments.id
);