-- FASE 2: Configurar Realtime completo para el sistema de chat
-- Añadir project_chat_participants a la publicación de Realtime

-- Verificar que project_messages ya está en la publicación (ya debería estar)
-- Si no está, agregarlo también
DO $$
BEGIN
  -- Agregar project_chat_participants a la publicación de Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'project_chat_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime 
    ADD TABLE project_chat_participants;
    
    RAISE NOTICE 'Tabla project_chat_participants agregada a supabase_realtime';
  ELSE
    RAISE NOTICE 'Tabla project_chat_participants ya está en supabase_realtime';
  END IF;
END $$;

-- Configurar REPLICA IDENTITY FULL para project_chat_participants
-- Esto permite que Realtime capture todos los cambios en la tabla
ALTER TABLE project_chat_participants 
REPLICA IDENTITY FULL;

-- Verificar que project_messages también tiene REPLICA IDENTITY FULL
ALTER TABLE project_messages 
REPLICA IDENTITY FULL;

-- Verificar que message_read_receipts también tiene REPLICA IDENTITY FULL
ALTER TABLE message_read_receipts 
REPLICA IDENTITY FULL;

COMMENT ON TABLE project_chat_participants IS 
'Tabla de participantes del chat con Realtime habilitado para sincronización ERP↔Client App';

COMMENT ON TABLE project_messages IS 
'Tabla de mensajes del chat con Realtime habilitado para sincronización ERP↔Client App';
