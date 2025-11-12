import { supabase } from '@/integrations/supabase/client';

/**
 * Crear notificación de proveedor actualizado
 * Se dispara cuando se actualiza información relevante de un proveedor
 */
export async function createProviderUpdatedNotification(
  userId: string,
  providerId: string,
  providerName: string,
  updateType: 'terms' | 'contact' | 'status'
) {
  try {
    const messages = {
      terms: `Se actualizaron los términos del proveedor "${providerName}"`,
      contact: `Se actualizó la información de contacto del proveedor "${providerName}"`,
      status: `El estado del proveedor "${providerName}" cambió`,
    };

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'provider_updated',
      title: '🏢 Proveedor Actualizado',
      message: messages[updateType],
      metadata: {
        provider_id: providerId,
        update_type: updateType,
      },
    });
  } catch (error) {
    console.error('Error creating provider updated notification:', error);
  }
}

/**
 * Notificar a un usuario específico cuando un proveedor cambia a inactivo
 */
export async function notifyProviderDeactivated(
  userId: string,
  providerId: string,
  providerName: string
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'provider_updated',
      title: '⚠️ Proveedor Desactivado',
      message: `El proveedor "${providerName}" fue desactivado. Revisa tus órdenes de compra activas.`,
      metadata: {
        provider_id: providerId,
        update_type: 'deactivated',
      },
    });
  } catch (error) {
    console.error('Error notifying provider deactivated:', error);
  }
}

/**
 * Notificar cuando un proveedor es agregado a un presupuesto
 */
export async function notifyProviderAddedToBudget(
  userId: string,
  providerId: string,
  providerName: string,
  budgetId: string,
  budgetName: string
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'provider_updated',
      title: '📦 Proveedor Asignado',
      message: `Se asignó "${providerName}" al presupuesto "${budgetName}"`,
      metadata: {
        provider_id: providerId,
        budget_id: budgetId,
      },
    });
  } catch (error) {
    console.error('Error creating provider assigned notification:', error);
  }
}
