/**
 * Sistema de Notificaciones para Dovita Core
 * 
 * Tipos de notificaciones soportadas:
 * - price_alert: Alerta cuando un item se desvía >5% del precio histórico
 * - budget_shared: Presupuesto compartido con el usuario
 * - budget_updated: Nueva versión de presupuesto publicada
 * - provider_updated: Proveedor actualizado (términos, contacto, estado)
 * - system: Notificaciones del sistema
 */

export * from './budgetNotifications';
export * from './providerNotifications';
