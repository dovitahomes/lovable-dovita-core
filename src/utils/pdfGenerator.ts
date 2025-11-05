import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { drawHeader, drawFooter } from './pdf/membrete';
import { hexToRgb } from './pdf/brand';

interface BudgetPDFData {
  budget: {
    type: string;
    version: number;
    iva_enabled: boolean;
    notas: string | null;
  };
  project: any;
  items: any[];
  corporateContent: any;
  subtotal: number;
  iva: number;
  total: number;
}

export async function generateBudgetPDF(data: BudgetPDFData) {
  const doc = new jsPDF({ orientation: 'portrait', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors from CMS
  const primaryColor = data.corporateContent?.color_primario || '#1e40af';
  const secondaryColor = data.corporateContent?.color_secundario || '#059669';
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);

  // Build brand object for letterhead
  const brand = {
    logoUrl: data.corporateContent?.logo_url || null,
    colorPrimario: primaryColor,
    colorSecundario: secondaryColor,
    razonSocial: data.corporateContent?.nombre_empresa || 'DOVITA',
    domicilio: data.corporateContent?.direccion || '',
    telefono: data.corporateContent?.telefono_principal || '',
    sitioWeb: data.corporateContent?.sitio_web || '',
    emailPrincipal: data.corporateContent?.email_principal || '',
  };

  // Draw institutional header
  let yPos = await drawHeader(doc, brand, { orientation: 'portrait' });

  // Document title
  yPos += 5;
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `PRESUPUESTO ${data.budget.type === 'parametrico' ? 'PARAMÉTRICO' : 'EJECUTIVO'}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  // Document info
  yPos += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  doc.text(`Versión: ${data.budget.version}`, 40, yPos);
  doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - 40, yPos, { align: 'right' });
  
  yPos += 8;
  doc.text(`Cliente: ${data.project?.clients?.name || 'N/A'}`, 40, yPos);
  
  if (data.budget.notas) {
    yPos += 8;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const notasLines = doc.splitTextToSize(`Notas: ${data.budget.notas}`, pageWidth - 80);
    notasLines.forEach((line: string) => {
      doc.text(line, 40, yPos);
      yPos += 10;
    });
    doc.setTextColor(0, 0, 0);
  }

  // Items table
  yPos += 15;

  const tableData = data.items.map((item) => {
    const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
    const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
    const total = cantNecesaria * precioUnit;

    return [
      `${item.mayor_name}\n${item.partida_name}`,
      item.descripcion || '-',
      item.unidad,
      item.cant_real.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      `${item.desperdicio_pct}%`,
      cantNecesaria.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      `$${item.costo_unit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `${item.honorarios_pct}%`,
      `$${precioUnit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [[
      'Concepto',
      'Descripción',
      'Unidad',
      'Cant.',
      'Desp.',
      'Cant. Nec.',
      'Costo Unit.',
      'Hon.',
      'Precio Unit.',
      'Total'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 22, halign: 'right' },
      9: { cellWidth: 26, halign: 'right' }
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (hookData) => {
      // Draw institutional footer on each page
      drawFooter(doc, brand, {
        pageNumber: hookData.pageNumber,
      });
    }
  });

  // Totals section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  const totalsX = pageWidth - 120;
  let totalsY = finalY;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(
    `$${data.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    pageWidth - 40,
    totalsY,
    { align: 'right' }
  );

  if (data.budget.iva_enabled) {
    totalsY += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('IVA (16%):', totalsX, totalsY);
    doc.text(
      `$${data.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      pageWidth - 40,
      totalsY,
      { align: 'right' }
    );
  }

  totalsY += 10;
  doc.setDrawColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.setLineWidth(1);
  doc.line(totalsX - 10, totalsY - 3, pageWidth - 40, totalsY - 3);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('TOTAL:', totalsX, totalsY + 5);
  doc.text(
    `$${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    pageWidth - 40,
    totalsY + 5,
    { align: 'right' }
  );

  // Save PDF with proper naming
  const clientName = data.project?.clients?.name || 'Proyecto';
  const fileName = `Presupuesto_${clientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
  
  return fileName;
}