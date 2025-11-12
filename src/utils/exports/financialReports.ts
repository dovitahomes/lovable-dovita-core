import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IncomeVsExpenses, ExpenseByCategory } from '@/hooks/finance/useFinancialReports';

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);

// Cash Flow Report PDF
export async function exportCashFlowPDF(data: IncomeVsExpenses[], startDate: Date, endDate: Date) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('Reporte de Flujo de Caja', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Período: ${format(startDate, 'dd MMM yyyy', { locale: es })} - ${format(endDate, 'dd MMM yyyy', { locale: es })}`, 14, 28);
  doc.text(`Generado: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: es })}`, 14, 34);

  // Table
  autoTable(doc, {
    startY: 40,
    head: [['Mes', 'Ingresos', 'Egresos', 'Balance']],
    body: data.map(row => [
      row.monthLabel,
      formatCurrency(row.ingresos),
      formatCurrency(row.egresos),
      formatCurrency(row.balance),
    ]),
    foot: [[
      'TOTAL',
      formatCurrency(data.reduce((sum, r) => sum + r.ingresos, 0)),
      formatCurrency(data.reduce((sum, r) => sum + r.egresos, 0)),
      formatCurrency(data.reduce((sum, r) => sum + r.balance, 0)),
    ]],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
  });

  doc.save(`flujo-caja-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Cash Flow Report Excel
export async function exportCashFlowExcel(data: IncomeVsExpenses[], startDate: Date, endDate: Date) {
  const ws = XLSX.utils.json_to_sheet(
    data.map(row => ({
      'Mes': row.monthLabel,
      'Ingresos': row.ingresos,
      'Egresos': row.egresos,
      'Balance': row.balance,
    }))
  );

  // Add totals row
  const totals = {
    'Mes': 'TOTAL',
    'Ingresos': data.reduce((sum, r) => sum + r.ingresos, 0),
    'Egresos': data.reduce((sum, r) => sum + r.egresos, 0),
    'Balance': data.reduce((sum, r) => sum + r.balance, 0),
  };
  XLSX.utils.sheet_add_json(ws, [totals], { skipHeader: true, origin: -1 });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Flujo de Caja');
  
  XLSX.writeFile(wb, `flujo-caja-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Expense Distribution PDF
export async function exportExpenseDistributionPDF(data: ExpenseByCategory[], startDate: Date, endDate: Date) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('Distribución de Gastos', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Período: ${format(startDate, 'dd MMM yyyy', { locale: es })} - ${format(endDate, 'dd MMM yyyy', { locale: es })}`, 14, 28);
  doc.text(`Generado: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: es })}`, 14, 34);

  // Table
  autoTable(doc, {
    startY: 40,
    head: [['Categoría', 'Monto', 'Porcentaje']],
    body: data.map(row => [
      row.category,
      formatCurrency(row.amount),
      `${row.percentage.toFixed(2)}%`,
    ]),
    foot: [[
      'TOTAL',
      formatCurrency(data.reduce((sum, r) => sum + r.amount, 0)),
      '100.00%',
    ]],
    theme: 'grid',
    headStyles: { fillColor: [168, 85, 247], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
  });

  doc.save(`distribucion-gastos-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Expense Distribution Excel
export async function exportExpenseDistributionExcel(data: ExpenseByCategory[], startDate: Date, endDate: Date) {
  const ws = XLSX.utils.json_to_sheet(
    data.map(row => ({
      'Categoría': row.category,
      'Monto': row.amount,
      'Porcentaje': `${row.percentage.toFixed(2)}%`,
    }))
  );

  // Add totals row
  const totals = {
    'Categoría': 'TOTAL',
    'Monto': data.reduce((sum, r) => sum + r.amount, 0),
    'Porcentaje': '100.00%',
  };
  XLSX.utils.sheet_add_json(ws, [totals], { skipHeader: true, origin: -1 });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Distribución Gastos');
  
  XLSX.writeFile(wb, `distribucion-gastos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Profit & Loss Report PDF
export async function exportProfitLossPDF(data: IncomeVsExpenses[], startDate: Date, endDate: Date) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('Estado de Resultados (P&L)', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Período: ${format(startDate, 'dd MMM yyyy', { locale: es })} - ${format(endDate, 'dd MMM yyyy', { locale: es })}`, 14, 28);
  doc.text(`Generado: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: es })}`, 14, 34);

  const totalIngresos = data.reduce((sum, r) => sum + r.ingresos, 0);
  const totalEgresos = data.reduce((sum, r) => sum + r.egresos, 0);
  const utilidadNeta = totalIngresos - totalEgresos;
  const margen = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;

  // Summary table
  autoTable(doc, {
    startY: 40,
    body: [
      ['Ingresos Totales', formatCurrency(totalIngresos)],
      ['Egresos Totales', formatCurrency(totalEgresos)],
      ['Utilidad Neta', formatCurrency(utilidadNeta)],
      ['Margen de Utilidad', `${margen.toFixed(2)}%`],
    ],
    theme: 'plain',
    styles: { fontSize: 12, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [51, 65, 85] },
      1: { halign: 'right', textColor: [15, 23, 42] },
    },
  });

  doc.save(`estado-resultados-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Balance Sheet PDF (simplified)
export async function exportBalanceSheetPDF(currentBalance: number) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('Balance General', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Fecha: ${format(new Date(), 'dd MMMM yyyy', { locale: es })}`, 14, 28);
  doc.text(`Generado: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: es })}`, 14, 34);

  // Balance summary
  autoTable(doc, {
    startY: 45,
    head: [['Concepto', 'Monto']],
    body: [
      ['Activos (Cuentas Bancarias)', formatCurrency(currentBalance)],
      ['Pasivos', formatCurrency(0)],
      ['Capital', formatCurrency(currentBalance)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
  });

  doc.save(`balance-general-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
