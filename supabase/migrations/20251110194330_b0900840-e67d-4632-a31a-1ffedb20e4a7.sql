-- ============================================
-- FASE 1: Habilitar Realtime en project_messages
-- ============================================

-- Configurar REPLICA IDENTITY FULL para capturar todos los cambios
ALTER TABLE public.project_messages REPLICA IDENTITY FULL;

-- Agregar tabla a publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- ============================================
-- FASE 2: Corregir RLS Policies para Colaboradores
-- ============================================

-- Primero, verificar policies existentes y eliminar la problemática si existe
DROP POLICY IF EXISTS "Collaborators can send messages" ON public.project_messages;

-- Policy mejorada: Colaboradores pueden enviar mensajes SOLO en proyectos donde están asignados
CREATE POLICY "Collaborators can send messages in assigned projects"
ON public.project_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.project_chat_participants pcp
    WHERE pcp.project_id = project_messages.project_id
    AND pcp.user_id = auth.uid()
    AND pcp.is_active = true
  )
);

-- Policy para clientes: pueden enviar mensajes en sus proyectos
CREATE POLICY "Clients can send messages in their projects"
ON public.project_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.project_chat_participants pcp
    WHERE pcp.project_id = project_messages.project_id
    AND pcp.user_id = auth.uid()
    AND pcp.participant_type = 'client'
    AND pcp.is_active = true
  )
);

-- Policy de lectura: participantes activos pueden leer mensajes
DROP POLICY IF EXISTS "Participants can view messages" ON public.project_messages;

CREATE POLICY "Active participants can view messages"
ON public.project_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_chat_participants pcp
    WHERE pcp.project_id = project_messages.project_id
    AND pcp.user_id = auth.uid()
    AND pcp.is_active = true
    AND (
      -- Respetar show_history_from
      pcp.show_history_from IS NULL 
      OR project_messages.created_at >= pcp.show_history_from
    )
  )
);

-- ============================================
-- FASE 3: Crear Datos de Prueba Básicos
-- ============================================

-- Nota: La creación de usuarios auth debe hacerse desde el dashboard
-- Aquí preparamos la estructura para cuando existan

-- Comentario para el usuario: 
-- Para probar completamente, necesitas:
-- 1. Crear usuario auth para el cliente desde Supabase Dashboard
-- 2. El trigger auto_add_project_chat_participants ya añade clientes automáticamente
-- 3. Los colaboradores se añaden via trigger auto_add_collaborator_to_chat

-- Verificar que los triggers están activos
DO $$
BEGIN
  -- Verificar trigger para clientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_project_created_add_participants'
  ) THEN
    RAISE NOTICE 'Trigger auto_add_project_chat_participants debe estar activo';
  END IF;
  
  -- Verificar trigger para colaboradores
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_collaborator_added_to_chat'
  ) THEN
    RAISE NOTICE 'Trigger auto_add_collaborator_to_chat debe estar activo';
  END IF;
END $$;