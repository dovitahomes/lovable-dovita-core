import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export async function exportBudgetToXLSX(budgetId: string) {
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select(`
      *,
      projects (
        id,
        clients (name)
      )
    `)
    .eq('id', budgetId)
    .single();

  if (budgetError || !budget) throw new Error('No se pudo cargar el presupuesto');

  const { data: items, error: itemsError } = await supabase
    .from('budget_items')
    .select(`
      *,
      mayor_id,
      partida_id,
      subpartida_id
    `)
    .eq('budget_id', budgetId)
    .order('order_index');

  if (itemsError) throw new Error('No se pudieron cargar las partidas');

  // Get TU nodes for names
  const mayorIds = [...new Set(items?.map(i => i.mayor_id).filter(Boolean))];
  const { data: mayores } = await supabase
    .from('tu_nodes')
    .select('id, name, code')
    .in('id', mayorIds);

  const mayoresMap = new Map(mayores?.map(m => [m.id, m]) || []);

  // Hoja Resumen
  const resumenData = items?.reduce((acc, item) => {
    const mayorId = item.mayor_id;
    if (!mayorId) return acc;
    
    const existing = acc.find(r => r.mayor_id === mayorId);
    if (existing) {
      existing.subtotal += item.total || 0;
    } else {
      const mayor = mayoresMap.get(mayorId);
      acc.push({
        mayor_id: mayorId,
        codigo: mayor?.code || '',
        nombre: mayor?.name || 'Sin categoría',
        subtotal: item.total || 0
      });
    }
    return acc;
  }, [] as any[]) || [];

  const resumenSheet = XLSX.utils.json_to_sheet(
    resumenData.map(r => ({
      'Código': r.codigo,
      'Categoría': r.nombre,
      'Subtotal': r.subtotal.toFixed(2)
    }))
  );

  // Hoja Partidas
  const partidasSheet = XLSX.utils.json_to_sheet(
    items?.map(item => ({
      'Código': mayoresMap.get(item.mayor_id)?.code || '',
      'Descripción': item.descripcion || '',
      'Cantidad': item.cant_necesaria || item.cant_real || 0,
      'Unidad': item.unidad || '',
      'Precio Unit.': (item.precio_unit || item.costo_unit || 0).toFixed(2),
      'Importe': (item.total || 0).toFixed(2),
      'Proveedor': item.proveedor_alias || ''
    })) || []
  );

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen');
  XLSX.utils.book_append_sheet(wb, partidasSheet, 'Partidas');

  // Generate filename
  const clientName = budget.projects?.clients?.name || 'SinCliente';
  const fecha = new Date().toISOString().split('T')[0];
  const filename = `Presupuesto_${clientName}_${fecha}.xlsx`;

  XLSX.writeFile(wb, filename);
}

export async function exportFinanceToXLSX(projectId?: string) {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      bank_accounts (
        numero_cuenta,
        banks (nombre)
      )
    `)
    .order('fecha', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: transactions, error } = await query;

  if (error) throw new Error('No se pudieron cargar las transacciones');

  const dataSheet = XLSX.utils.json_to_sheet(
    transactions?.map(t => ({
      'Fecha': new Date(t.date).toLocaleDateString('es-MX'),
      'Tipo': t.type === 'ingreso' ? 'Ingreso' : 'Egreso',
      'Concepto': t.concept || '',
      'Monto': t.amount.toFixed(2),
      'Banco': t.bank_accounts?.banks?.nombre || '',
      'Cuenta': t.bank_accounts?.numero_cuenta || ''
    })) || []
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Transacciones');

  const fecha = new Date().toISOString().split('T')[0];
  const filename = `Reporte_Finanzas_${fecha}.xlsx`;

  XLSX.writeFile(wb, filename);
}
