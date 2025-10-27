import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

export async function exportBudgetToPDF(budgetId: string) {
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

  const { data: mayores } = await supabase
    .from('tu_nodes')
    .select('id, name, code')
    .in('id', [...new Set(items?.map(i => i.mayor_id).filter(Boolean))]);

  const mayoresMap = new Map(mayores?.map(m => [m.id, m]) || []);

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text('Presupuesto', 14, 22);
  doc.setFontSize(11);
  doc.text(`Cliente: ${budget.projects?.clients?.name || 'N/A'}`, 14, 30);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 14, 36);
  doc.text(`Versión: ${budget.version}`, 14, 42);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [['Código', 'Descripción', 'Cantidad', 'Unidad', 'Precio', 'Total']],
    body: items?.map(item => [
      mayoresMap.get(item.mayor_id)?.code || '',
      item.descripcion || '',
      (item.cant_necesaria || item.cant_real || 0).toFixed(2),
      item.unidad || '',
      (item.precio_unit || item.costo_unit || 0).toFixed(2),
      (item.total || 0).toFixed(2)
    ]) || [],
    foot: [[
      '', '', '', '', 'Total:',
      items?.reduce((sum, i) => sum + (i.total || 0), 0).toFixed(2)
    ]],
    theme: 'striped',
    styles: { fontSize: 9 },
    footStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }
  });

  // Footer with page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  const clientName = budget.projects?.clients?.name || 'SinCliente';
  const fecha = new Date().toISOString().split('T')[0];
  doc.save(`Presupuesto_${clientName}_${fecha}.pdf`);
}

export async function exportFinanceToPDF(projectId?: string) {
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

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Reporte Financiero', 14, 22);
  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['Fecha', 'Tipo', 'Concepto', 'Monto', 'Banco']],
    body: transactions?.map(t => [
      new Date(t.date).toLocaleDateString('es-MX'),
      t.type === 'ingreso' ? 'Ingreso' : 'Egreso',
      t.concept || '',
      `$${t.amount.toFixed(2)}`,
      t.bank_accounts?.banks?.nombre || ''
    ]) || [],
    theme: 'striped',
    styles: { fontSize: 9 }
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  const fecha = new Date().toISOString().split('T')[0];
  doc.save(`Reporte_Finanzas_${fecha}.pdf`);
}
