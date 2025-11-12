import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { ExecutiveBudgetItem, TUNode } from '@/components/budgets/executive/ExecutiveBudgetWizard';

interface PreviewData {
  formData: {
    project_id?: string;
    iva_enabled?: boolean;
    cliente_view_enabled?: boolean;
    shared_with_construction?: boolean;
    notas?: string;
  };
  selectedSubpartidas: TUNode[];
  items: ExecutiveBudgetItem[];
}

const calculateItemTotal = (item: ExecutiveBudgetItem) => {
  const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
  const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
  return cantNecesaria * precioUnit;
};

export async function exportExecutivePreviewToPDF(previewData: PreviewData) {
  const { formData, selectedSubpartidas, items } = previewData;

  if (!formData.project_id) {
    throw new Error('Project ID is required');
  }

  // Fetch project info
  const { data: project } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .eq('id', formData.project_id)
    .single();

  const subpartidasMap = new Map(selectedSubpartidas.map(s => [s.id, s]));
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESUPUESTO EJECUTIVO', 14, 20);
  
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
  doc.text(`Vista Cliente: ${formData.cliente_view_enabled ? 'Habilitada' : 'Deshabilitada'}`, 14, 54);

  if (formData.notas) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    const splitNotes = doc.splitTextToSize(`Notas: ${formData.notas}`, 180);
    doc.text(splitNotes, 14, 60);
  }

  // Group items by subpartida
  const itemsBySubpartida = selectedSubpartidas.map(subpartida => {
    const subpartidaItems = items.filter(item => item.subpartida_id === subpartida.id);
    const subpartidaSubtotal = subpartidaItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    return { subpartida, items: subpartidaItems, subtotal: subpartidaSubtotal };
  });

  // Table data
  const tableData: any[] = [];
  itemsBySubpartida.forEach(({ subpartida, items: subpartidaItems, subtotal }) => {
    // Subpartida header row
    tableData.push([
      { content: `${subpartida.code} - ${subpartida.name}`, colSpan: formData.cliente_view_enabled ? 5 : 8, styles: { 
        fillColor: [139, 92, 246], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 10
      }},
      { content: `$${subtotal.toFixed(2)}`, styles: { 
        fillColor: [139, 92, 246], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'right'
      }}
    ]);

    // Items
    subpartidaItems.forEach(item => {
      const total = calculateItemTotal(item);
      
      if (formData.cliente_view_enabled) {
        // Vista cliente: ocultar costo_unit, desperdicio_pct, honorarios_pct
        tableData.push([
          item.descripcion || 'Sin descripción',
          item.cant_real.toFixed(2),
          item.unidad || 'pieza',
          item.proveedor_alias || '---',
          `$${total.toFixed(2)}`
        ]);
      } else {
        // Vista completa
        tableData.push([
          item.descripcion || 'Sin descripción',
          item.cant_real.toFixed(2),
          item.unidad || 'pieza',
          `${item.desperdicio_pct}%`,
          `$${item.costo_unit.toFixed(2)}`,
          `${item.honorarios_pct}%`,
          item.proveedor_alias || '---',
          `$${total.toFixed(2)}`
        ]);
      }
    });
  });

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const iva = formData.iva_enabled ? subtotal * 0.16 : 0;
  const total = subtotal + iva;

  const headers = formData.cliente_view_enabled
    ? [['Descripción', 'Cantidad', 'Unidad', 'Proveedor', 'Total']]
    : [['Descripción', 'Cantidad', 'Unidad', 'Desp.%', 'Costo Unit.', 'Hon.%', 'Proveedor', 'Total']];

  const footerColSpan = formData.cliente_view_enabled ? 4 : 7;

  autoTable(doc, {
    startY: formData.notas ? 71 : 62,
    head: headers,
    body: tableData,
    foot: [
      [{ content: '', colSpan: footerColSpan }, 'Subtotal:', `$${subtotal.toFixed(2)}`],
      ...(formData.iva_enabled ? [[{ content: '', colSpan: footerColSpan }, 'IVA (16%):', `$${iva.toFixed(2)}`]] : []),
      [{ content: '', colSpan: footerColSpan }, 'TOTAL:', `$${total.toFixed(2)}`]
    ],
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    columnStyles: formData.cliente_view_enabled ? {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'right' },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30, halign: 'right' }
    } : {
      0: { cellWidth: 60 },
      1: { cellWidth: 18, halign: 'right' },
      2: { cellWidth: 15 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 20 },
      7: { cellWidth: 25, halign: 'right' }
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
  doc.save(`Presupuesto_Ejecutivo_${clientName}_${fecha}.pdf`);
}

export async function exportExecutivePreviewToXLSX(previewData: PreviewData) {
  const { formData, selectedSubpartidas, items } = previewData;

  if (!formData.project_id) {
    throw new Error('Project ID is required');
  }

  // Fetch project info
  const { data: project } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .eq('id', formData.project_id)
    .single();

  const subpartidasMap = new Map(selectedSubpartidas.map(s => [s.id, s]));

  // Hoja Resumen por Subpartida
  const resumenData = selectedSubpartidas.map(subpartida => {
    const subpartidaItems = items.filter(item => item.subpartida_id === subpartida.id);
    const subtotal = subpartidaItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    return {
      'Código': subpartida.code,
      'Subpartida': subpartida.name,
      'Items': subpartidaItems.length,
      'Subtotal': subtotal.toFixed(2)
    };
  });

  const resumenSheet = XLSX.utils.json_to_sheet(resumenData);

  // Hoja Detalle de Items
  const itemsData = items.map(item => {
    const subpartida = subpartidasMap.get(item.subpartida_id);
    const total = calculateItemTotal(item);
    
    const baseData = {
      'Subpartida': `${subpartida?.code} - ${subpartida?.name}`,
      'Descripción': item.descripcion || 'Sin descripción',
      'Cantidad': item.cant_real,
      'Unidad': item.unidad || 'pieza',
    };

    if (formData.cliente_view_enabled) {
      // Vista cliente: ocultar columnas sensibles
      return {
        ...baseData,
        'Proveedor': item.proveedor_alias || '---',
        'Total': total.toFixed(2)
      };
    } else {
      // Vista completa
      return {
        ...baseData,
        'Desperdicio %': item.desperdicio_pct,
        'Costo Unit.': item.costo_unit.toFixed(2),
        'Honorarios %': item.honorarios_pct,
        'Proveedor': item.proveedor_alias || '---',
        'Total': total.toFixed(2)
      };
    }
  });

  const itemsSheet = XLSX.utils.json_to_sheet(itemsData);

  // Hoja Info General
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const iva = formData.iva_enabled ? subtotal * 0.16 : 0;
  const total = subtotal + iva;

  const infoData = [
    { 'Campo': 'Cliente', 'Valor': project?.clients?.name || 'N/A' },
    { 'Campo': 'Proyecto', 'Valor': project?.project_name || 'N/A' },
    { 'Campo': 'Fecha', 'Valor': new Date().toLocaleDateString('es-MX') },
    { 'Campo': 'IVA Incluido', 'Valor': formData.iva_enabled ? 'Sí (16%)' : 'No' },
    { 'Campo': 'Vista Cliente', 'Valor': formData.cliente_view_enabled ? 'Habilitada' : 'Deshabilitada' },
    { 'Campo': 'Compartir Construcción', 'Valor': formData.shared_with_construction ? 'Sí' : 'No' },
    { 'Campo': '', 'Valor': '' },
    { 'Campo': 'Total Subpartidas', 'Valor': selectedSubpartidas.length },
    { 'Campo': 'Total Items', 'Valor': items.length },
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
  XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen por Subpartida');
  XLSX.utils.book_append_sheet(wb, itemsSheet, 'Detalle Items');

  // Generate filename
  const clientName = project?.clients?.name?.replace(/[^a-z0-9]/gi, '_') || 'SinCliente';
  const fecha = new Date().toISOString().split('T')[0];
  const filename = `Presupuesto_Ejecutivo_${clientName}_${fecha}.xlsx`;

  XLSX.writeFile(wb, filename);
}
