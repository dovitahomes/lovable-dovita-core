-- Agregar columna updated_by a la tabla tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_tasks_updated_by ON tasks(updated_by);

-- Crear trigger para auto-setear updated_by en cada UPDATE
CREATE OR REPLACE FUNCTION set_tasks_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tasks_set_updated_by ON tasks;
CREATE TRIGGER tasks_set_updated_by
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_tasks_updated_by();

-- Comentario de documentación
COMMENT ON COLUMN tasks.updated_by IS 'Usuario que realizó la última actualización de la tarea';