/**
 * Módulo CRM - Capa de Datos Centralizada
 * Exporta todas las funciones de acceso a datos con sesión validada
 */

export * from './session';
export * from './tasks';

// Note: CRM Attachments use hooks directly, see @/hooks/crm/useCrmAttachments
// Note: Opportunities consolidated into Leads - see @/hooks/crm/useLeadsAnalytics
// Note: Accounts and Contacts have been removed from the CRM - use Leads and Clients instead
