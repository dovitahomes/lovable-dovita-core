import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { BudgetItem, Mayor } from '@/components/budgets/parametric/ParametricBudgetWizard';

interface PreviewData {
  formData: {
    project_id: string;
    iva_enabled: boolean;
    notas?: string;
  };
  selectedMayores: Mayor[];
  items: BudgetItem[];
}

const calculateItemTotal = (item: BudgetItem) => {
  const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
  const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
  return cantNecesaria * precioUnit;
};

export async function exportParametricPreviewToPDF(previewData: PreviewData) {
  const { formData, selectedMayores, items } = previewData;

  // Fetch project info
  const { data: project } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .eq('id', formData.project_id)
    .single();

  // Fetch partidas info
  const partidaIds = [...new Set(items.map(i => i.partida_id))];
  const { data: partidas } = await supabase
    .from('tu_nodes')
    .select('id, name, code')
    .in('id', partidaIds);

  const partidasMap = new Map(partidas?.map(p => [p.id, p]) || []);
  const mayoresMap = new Map(selectedMayores.map(m => [m.id, m]));

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESUPUESTO PARAMÉTRICO', 14, 20);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${project?.clients?.name || 'N/A'}`, 14, 30);
  doc.text(`Proyecto: ${project?.project_name || 'N/A'}`, 14, 36);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 14, 42);
  doc.text(`IVA: ${formData.iva_enabled ? 'Incluido (16%)' : 'No incluido'}`, 14, 48);

  if (formData.notas) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    const splitNotes = doc.splitTextToSize(`Notas: ${formData.notas}`, 180);
    doc.text(splitNotes, 14, 54);
  }

  // Group items by mayor
  const itemsByMayor = selectedMayores.map(mayor => {
    const mayorItems = items.filter(item => item.mayor_id === mayor.id);
    const mayorSubtotal = mayorItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    return { mayor, items: mayorItems, subtotal: mayorSubtotal };
  });

  // Table data
  const tableData: any[] = [];
  itemsByMayor.forEach(({ mayor, items: mayorItems, subtotal }) => {
    // Mayor header row
    tableData.push([
      { content: `${mayor.code} - ${mayor.name}`, colSpan: 5, styles: { 
        fillColor: [41, 128, 185], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 10
      }},
      { content: `$${subtotal.toFixed(2)}`, styles: { 
        fillColor: [41, 128, 185], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'right'
      }}
    ]);

    // Items
    mayorItems.forEach(item => {
      const partida = partidasMap.get(item.partida_id);
      const total = calculateItemTotal(item);
      tableData.push([
        partida?.code || '---',
        item.descripcion || partida?.name || 'Sin descripción',
        item.cant_real.toFixed(2),
        item.unidad || 'pieza',
        `$${item.costo_unit.toFixed(2)}`,
        `$${total.toFixed(2)}`
      ]);
    });
  });

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const iva = formData.iva_enabled ? subtotal * 0.16 : 0;
  const total = subtotal + iva;

  autoTable(doc, {
    startY: formData.notas ? 65 : 58,
    head: [['Código', 'Descripción', 'Cantidad', 'Unidad', 'P. Unit.', 'Total']],
    body: tableData,
    foot: [
      ['', '', '', '', 'Subtotal:', `$${subtotal.toFixed(2)}`],
      ...(formData.iva_enabled ? [['', '', '', '', 'IVA (16%):', `$${iva.toFixed(2)}`]] : []),
      ['', '', '', '', 'TOTAL:', `$${total.toFixed(2)}`]
    ],
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 70 },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 20 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    }
  });

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  const clientName = project?.clients?.name?.replace(/[^a-z0-9]/gi, '_') || 'SinCliente';
  const fecha = new Date().toISOString().split('T')[0];
  doc.save(`Presupuesto_Parametrico_${clientName}_${fecha}.pdf`);
}

export async function exportParametricPreviewToXLSX(previewData: PreviewData) {
  const { formData, selectedMayores, items } = previewData;

  // Fetch project info
  const { data: project } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .eq('id', formData.project_id)
    .single();

  // Fetch partidas info
  const partidaIds = [...new Set(items.map(i => i.partida_id))];
  const { data: partidas } = await supabase
    .from('tu_nodes')
    .select('id, name, code')
    .in('id', partidaIds);

  const partidasMap = new Map(partidas?.map(p => [p.id, p]) || []);
  const mayoresMap = new Map(selectedMayores.map(m => [m.id, m]));

  // Hoja Resumen por Mayor
  const resumenData = selectedMayores.map(mayor => {
    const mayorItems = items.filter(item => item.mayor_id === mayor.id);
    const subtotal = mayorItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    return {
      'Código': mayor.code,
      'Mayor': mayor.name,
      'Items': mayorItems.length,
      'Subtotal': subtotal.toFixed(2)
    };
  });

  const resumenSheet = XLSX.utils.json_to_sheet(resumenData);

  // Hoja Detalle de Partidas
  const partidasData = items.map(item => {
    const mayor = mayoresMap.get(item.mayor_id);
    const partida = partidasMap.get(item.partida_id);
    const total = calculateItemTotal(item);
    
    return {
      'Mayor': `${mayor?.code} - ${mayor?.name}`,
      'Código Partida': partida?.code || '---',
      'Descripción': item.descripcion || partida?.name || 'Sin descripción',
      'Cantidad': item.cant_real,
      'Unidad': item.unidad || 'pieza',
      'Desperdicio %': item.desperdicio_pct,
      'Costo Unit.': item.costo_unit.toFixed(2),
      'Honorarios %': item.honorarios_pct,
      'Total': total.toFixed(2)
    };
  });

  const partidasSheet = XLSX.utils.json_to_sheet(partidasData);

  // Hoja Info General
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const iva = formData.iva_enabled ? subtotal * 0.16 : 0;
  const total = subtotal + iva;

  const infoData = [
    { 'Campo': 'Cliente', 'Valor': project?.clients?.name || 'N/A' },
    { 'Campo': 'Proyecto', 'Valor': project?.project_name || 'N/A' },
    { 'Campo': 'Fecha', 'Valor': new Date().toLocaleDateString('es-MX') },
    { 'Campo': 'IVA Incluido', 'Valor': formData.iva_enabled ? 'Sí (16%)' : 'No' },
    { 'Campo': '', 'Valor': '' },
    { 'Campo': 'Total Mayores', 'Valor': selectedMayores.length },
    { 'Campo': 'Total Partidas', 'Valor': items.length },
    { 'Campo': '', 'Valor': '' },
    { 'Campo': 'Subtotal', 'Valor': `$${subtotal.toFixed(2)}` },
    ...(formData.iva_enabled ? [{ 'Campo': 'IVA (16%)', 'Valor': `$${iva.toFixed(2)}` }] : []),
    { 'Campo': 'TOTAL', 'Valor': `$${total.toFixed(2)}` }
  ];

  if (formData.notas) {
    infoData.push({ 'Campo': '', 'Valor': '' });
    infoData.push({ 'Campo': 'Notas', 'Valor': formData.notas });
  }

  const infoSheet = XLSX.utils.json_to_sheet(infoData);

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Info General');
  XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen por Mayor');
  XLSX.utils.book_append_sheet(wb, partidasSheet, 'Detalle Partidas');

  // Generate filename
  const clientName = project?.clients?.name?.replace(/[^a-z0-9]/gi, '_') || 'SinCliente';
  const fecha = new Date().toISOString().split('T')[0];
  const filename = `Presupuesto_Parametrico_${clientName}_${fecha}.xlsx`;

  XLSX.writeFile(wb, filename);
}
