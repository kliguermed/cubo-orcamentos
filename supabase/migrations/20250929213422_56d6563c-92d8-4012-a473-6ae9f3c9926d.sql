-- Add calculation rules columns to budgets table
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS markup_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rt_type text DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS rt_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rt_distribution text DEFAULT 'diluted',
ADD COLUMN IF NOT EXISTS labor_type text DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS labor_value numeric DEFAULT 0;

-- Populate existing budgets with current settings values
UPDATE budgets b
SET 
  markup_percentage = COALESCE(s.markup_percentage, 0),
  rt_type = COALESCE(s.rt_type, 'percentage'),
  rt_value = COALESCE(s.rt_value, 0),
  rt_distribution = COALESCE(s.rt_distribution, 'diluted'),
  labor_type = COALESCE(s.labor_type, 'percentage'),
  labor_value = COALESCE(s.labor_value, 0)
FROM settings s
WHERE b.user_id = s.user_id 
  AND b.markup_percentage IS NULL;