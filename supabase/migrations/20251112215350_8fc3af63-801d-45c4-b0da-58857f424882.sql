-- Add alianza_id column to commission_rules for alliance-specific rules
ALTER TABLE commission_rules
ADD COLUMN alianza_id UUID REFERENCES alianzas(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_commission_rules_alianza ON commission_rules(alianza_id);

-- Add comment explaining the new architecture
COMMENT ON COLUMN commission_rules.alianza_id IS 'Optional alliance ID. NULL means global rule, non-NULL means alliance-specific rule';

-- Update RLS policies to allow viewing alliance-specific rules
DROP POLICY IF EXISTS comisiones_view_commission_rules ON commission_rules;
CREATE POLICY comisiones_view_commission_rules ON commission_rules
FOR SELECT
USING (
  current_user_has_role('admin') OR 
  user_has_module_permission(auth.uid(), 'comisiones', 'view')
);