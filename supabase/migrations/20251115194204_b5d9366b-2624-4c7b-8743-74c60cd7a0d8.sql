-- Crear política RLS para DELETE en la tabla leads
-- Permite a usuarios autenticados eliminar leads (los colaboradores pueden gestionar leads)

CREATE POLICY "Authenticated users can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (true);

-- Agregar CASCADE DELETE en las relaciones de crm_activities y crm_notes
-- para que al eliminar un lead se eliminen sus actividades y notas relacionadas

-- Primero verificar si existen las foreign keys y eliminarlas si existen
DO $$
BEGIN
    -- Intentar eliminar la foreign key de crm_activities si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'crm_activities_entity_id_fkey'
        AND table_name = 'crm_activities'
    ) THEN
        ALTER TABLE public.crm_activities 
        DROP CONSTRAINT crm_activities_entity_id_fkey;
    END IF;
END $$;

-- No podemos crear una foreign key directa porque entity_id apunta a diferentes tablas
-- dependiendo de entity_type. La eliminación en cascada se manejará a nivel de aplicación
-- o mediante triggers si es necesario.

-- Comentario: Las actividades relacionadas con leads se pueden eliminar manualmente
-- o se puede crear un trigger para hacerlo automáticamente:

CREATE OR REPLACE FUNCTION delete_lead_related_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar actividades relacionadas
  DELETE FROM public.crm_activities
  WHERE entity_type = 'lead' AND entity_id = OLD.id;
  
  -- Eliminar notas relacionadas (si existe la tabla crm_notes)
  -- DELETE FROM public.crm_notes WHERE lead_id = OLD.id;
  
  -- Eliminar tareas relacionadas (si existe la relación)
  DELETE FROM public.tasks
  WHERE related_to_type = 'lead' AND related_to_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear trigger para ejecutar la función antes de eliminar un lead
DROP TRIGGER IF EXISTS before_delete_lead ON public.leads;

CREATE TRIGGER before_delete_lead
BEFORE DELETE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION delete_lead_related_data();