import { supabase } from "@/integrations/supabase/client";

/**
 * Calcula la comisión para una alianza específica
 * 
 * @param alianzaId - ID de la alianza
 * @param baseAmount - Monto base sobre el cual calcular la comisión
 * @param appliesOn - Cuándo aplica la comisión ('cierre' o 'pago')
 * @returns Objeto con datos de la comisión calculada o null si la alianza está inactiva
 */
export async function calculateAllianceCommission(
  alianzaId: string,
  baseAmount: number,
  appliesOn: 'cierre' | 'pago' = 'cierre'
) {
  try {
    // 1. Obtener alianza con su comision_porcentaje específico
    const { data: alianza, error: alianzaError } = await supabase
      .from('alianzas')
      .select('comision_porcentaje, activa, nombre')
      .eq('id', alianzaId)
      .single();

    if (alianzaError) {
      throw alianzaError;
    }

    // 2. Validar que la alianza esté activa
    if (!alianza?.activa) {
      console.warn(`Alianza ${alianzaId} está inactiva, no se calcula comisión`);
      return null;
    }

    // 3. Usar porcentaje específico de la alianza (NO global)
    const percent = alianza.comision_porcentaje;
    const calculatedAmount = baseAmount * (percent / 100);

    return {
      percent,
      calculatedAmount,
      baseAmount,
      alianzaNombre: alianza.nombre,
    };
  } catch (error) {
    console.error('Error al calcular comisión de alianza:', error);
    throw error;
  }
}

/**
 * Inserta una comisión calculada en la base de datos
 * 
 * @param alianzaId - ID de la alianza
 * @param dealRef - Referencia al presupuesto/deal
 * @param baseAmount - Monto base
 * @param appliesOn - Cuándo aplica ('cierre' o 'pago')
 * @returns Comisión insertada
 */
export async function insertAllianceCommission(
  alianzaId: string,
  dealRef: string,
  baseAmount: number,
  appliesOn: 'cierre' | 'pago' = 'cierre'
) {
  try {
    // 1. Calcular comisión
    const calculated = await calculateAllianceCommission(alianzaId, baseAmount, appliesOn);

    if (!calculated) {
      throw new Error('No se pudo calcular la comisión (alianza inactiva)');
    }

    // 2. Insertar comisión en BD
    const { data: commission, error: insertError } = await supabase
      .from('commissions')
      .insert({
        tipo: 'alianza',
        sujeto_id: alianzaId,
        deal_ref: dealRef,
        base_amount: baseAmount,
        percent: calculated.percent,
        calculated_amount: calculated.calculatedAmount,
        status: 'calculada',
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return commission;
  } catch (error) {
    console.error('Error al insertar comisión de alianza:', error);
    throw error;
  }
}

/**
 * Calcula la comisión para un colaborador
 * 
 * @param colaboradorId - ID del colaborador (user_id)
 * @param baseAmount - Monto base
 * @param projectType - Tipo de proyecto ('arquitectura' | 'construccion')
 * @returns Objeto con datos de la comisión calculada
 */
export async function calculateCollaboratorCommission(
  colaboradorId: string,
  baseAmount: number,
  projectType: 'arquitectura' | 'construccion'
) {
  try {
    // 1. Obtener configuración global de comisiones de colaboradores
    const { data: config, error: configError } = await supabase
      .from('commission_config')
      .select('collaborator_architecture_percent, collaborator_construction_percent')
      .single();

    if (configError) {
      throw configError;
    }

    // 2. Seleccionar porcentaje según tipo de proyecto
    const percent =
      projectType === 'arquitectura'
        ? config.collaborator_architecture_percent
        : config.collaborator_construction_percent;

    const calculatedAmount = baseAmount * (percent / 100);

    return {
      percent,
      calculatedAmount,
      baseAmount,
      projectType,
    };
  } catch (error) {
    console.error('Error al calcular comisión de colaborador:', error);
    throw error;
  }
}

/**
 * Inserta una comisión de colaborador en la base de datos
 * 
 * @param colaboradorId - ID del colaborador
 * @param dealRef - Referencia al proyecto/deal
 * @param baseAmount - Monto base
 * @param projectType - Tipo de proyecto
 * @returns Comisión insertada
 */
export async function insertCollaboratorCommission(
  colaboradorId: string,
  dealRef: string,
  baseAmount: number,
  projectType: 'arquitectura' | 'construccion'
) {
  try {
    // 1. Calcular comisión
    const calculated = await calculateCollaboratorCommission(colaboradorId, baseAmount, projectType);

    // 2. Insertar comisión en BD
    const { data: commission, error: insertError } = await supabase
      .from('commissions')
      .insert({
        tipo: 'colaborador',
        sujeto_id: colaboradorId,
        deal_ref: dealRef,
        base_amount: baseAmount,
        percent: calculated.percent,
        calculated_amount: calculated.calculatedAmount,
        status: 'calculada',
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return commission;
  } catch (error) {
    console.error('Error al insertar comisión de colaborador:', error);
    throw error;
  }
}
