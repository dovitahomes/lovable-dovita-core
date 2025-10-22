import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function generateBudgetPDF(data: BudgetPDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor: [number, number, number] = [30, 64, 175]; // Blue
  const secondaryColor: [number, number, number] = [5, 150, 105]; // Green

  // Header with corporate info
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.corporateContent?.nombre_empresa || 'DOVITA', 15, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.corporateContent?.telefono_principal) {
    doc.text(`Tel: ${data.corporateContent.telefono_principal}`, 15, 28);
  }
  if (data.corporateContent?.email_principal) {
    doc.text(`Email: ${data.corporateContent.email_principal}`, 15, 35);
  }

  // Document title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESUPUESTO PARAMÉTRICO', pageWidth / 2, 55, { align: 'center' });

  // Document info
  let yPos = 70;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Versión: ${data.budget.version}`, 15, yPos);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, pageWidth - 70, yPos);
  
  yPos += 10;
  doc.text(`Cliente: ${data.project?.clients?.name || 'N/A'}`, 15, yPos);
  
  if (data.budget.notas) {
    yPos += 7;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Notas: ${data.budget.notas}`, 15, yPos);
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
      fillColor: primaryColor,
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
    margin: { left: 10, right: 10 },
    didDrawPage: (hookData) => {
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${hookData.pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });

  // Totals section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const totalsX = pageWidth - 80;
  let totalsY = finalY;

  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX - 5, totalsY - 5, pageWidth - 10, totalsY - 5);

  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(
    `$${data.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    pageWidth - 15,
    totalsY,
    { align: 'right' }
  );

  if (data.budget.iva_enabled) {
    totalsY += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('IVA (16%):', totalsX, totalsY);
    doc.text(
      `$${data.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      pageWidth - 15,
      totalsY,
      { align: 'right' }
    );
  }

  totalsY += 7;
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 5, totalsY - 2, pageWidth - 10, totalsY - 2);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL:', totalsX, totalsY + 5);
  doc.text(
    `$${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    pageWidth - 15,
    totalsY + 5,
    { align: 'right' }
  );

  // Footer info
  if (data.corporateContent?.direccion) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(
      data.corporateContent.direccion,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `presupuesto-${data.project?.clients?.name || 'proyecto'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}