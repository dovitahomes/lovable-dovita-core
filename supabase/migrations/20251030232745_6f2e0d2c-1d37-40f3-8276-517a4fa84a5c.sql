-- Add provider_id to budget_items if not exists
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_budget_items_provider_id ON budget_items(provider_id);

-- Trigger para updated_at en providers (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_providers_updated ON providers;
CREATE TRIGGER trg_providers_updated 
  BEFORE UPDATE ON providers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para generar code_short automáticamente si viene vacío
CREATE OR REPLACE FUNCTION providers_generate_code()
RETURNS TRIGGER AS $$
DECLARE 
  base text; 
  seq int;
BEGIN
  IF NEW.code_short IS NULL OR LENGTH(TRIM(NEW.code_short)) = 0 THEN
    base := UPPER(REGEXP_REPLACE(COALESCE(NEW.name, 'PRV'), '[^A-Za-z]', '', 'g'));
    base := SUBSTR(base, 1, 3);
    IF base = '' THEN 
      base := 'PRV'; 
    END IF;
    seq := FLOOR(RANDOM() * 90)::int + 10; -- 2 dígitos
    NEW.code_short := base || seq::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_providers_code ON providers;
CREATE TRIGGER trg_providers_code 
  BEFORE INSERT ON providers
  FOR EACH ROW 
  EXECUTE FUNCTION providers_generate_code();