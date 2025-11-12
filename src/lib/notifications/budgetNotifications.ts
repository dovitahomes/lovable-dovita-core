import { supabase } from '@/integrations/supabase/client';

/**
 * Crear notificación de alerta de precio
 * Se dispara cuando un item del presupuesto se desvía >5% del precio histórico
 */
export async function createPriceAlertNotification(
  userId: string,
  budgetId: string,
  itemDescription: string,
  priceDeviation: number
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'price_alert',
      title: '⚠️ Alerta de Precio',
      message: `"${itemDescription}" tiene un precio ${priceDeviation > 0 ? 'mayor' : 'menor'} al histórico (${Math.abs(priceDeviation).toFixed(1)}%)`,
      metadata: {
        budget_id: budgetId,
        item_description: itemDescription,
        price_deviation: priceDeviation,
      },
    });
  } catch (error) {
    console.error('Error creating price alert notification:', error);
  }
}

/**
 * Crear notificación de presupuesto compartido
 * Se dispara cuando un presupuesto es compartido con un usuario
 */
export async function createBudgetSharedNotification(
  userId: string,
  budgetId: string,
  budgetName: string,
  sharedBy: string
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'budget_shared',
      title: '📊 Presupuesto Compartido',
      message: `${sharedBy} compartió el presupuesto "${budgetName}" contigo`,
      metadata: {
        budget_id: budgetId,
        shared_by: sharedBy,
      },
    });
  } catch (error) {
    console.error('Error creating budget shared notification:', error);
  }
}

/**
 * Crear notificación de presupuesto actualizado
 * Se dispara cuando se publica una nueva versión de un presupuesto
 */
export async function createBudgetUpdatedNotification(
  userId: string,
  budgetId: string,
  budgetName: string,
  newVersion: number
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'budget_updated',
      title: '📝 Presupuesto Actualizado',
      message: `Nueva versión ${newVersion} del presupuesto "${budgetName}"`,
      metadata: {
        budget_id: budgetId,
        version: newVersion,
      },
    });
  } catch (error) {
    console.error('Error creating budget updated notification:', error);
  }
}

/**
 * Notificar a un usuario específico cuando se publica un presupuesto
 */
export async function notifyBudgetPublished(
  userId: string,
  budgetId: string,
  budgetName: string
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'budget_updated',
      title: '✅ Presupuesto Publicado',
      message: `Se publicó el presupuesto "${budgetName}"`,
      metadata: {
        budget_id: budgetId,
      },
    });
  } catch (error) {
    console.error('Error notifying budget published:', error);
  }
}
