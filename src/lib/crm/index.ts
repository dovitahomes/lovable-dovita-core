/**
 * Módulo CRM - Capa de Datos Centralizada
 * Exporta todas las funciones de acceso a datos con sesión validada
 */

export * from './session';
export * from './accounts';
export * from './contacts';
export * from './opportunities';
export * from './tasks';

// Note: CRM Attachments use hooks directly, see @/hooks/crm/useCrmAttachments
