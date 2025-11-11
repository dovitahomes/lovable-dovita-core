-- FASE 5 CRM: Agregar permisos del módulo 'crm' para usuarios existentes
-- Esto permite que "Tareas", "Cuentas", "Contactos" y "Oportunidades" aparezcan en el sidebar

-- Insertar permisos de 'crm' para todos los usuarios que tienen permisos de 'leads'
-- Usando los mismos niveles de permisos (view, create, edit, delete)
INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT user_id, 'crm', can_view, can_create, can_edit, can_delete
FROM user_permissions
WHERE module_name = 'leads'
ON CONFLICT (user_id, module_name) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete;