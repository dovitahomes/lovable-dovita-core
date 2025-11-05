import type jsPDF from "jspdf";
import type { CorporateBrand } from "./brand";
import { hexToRgb } from "./brand";
import type { PageOrientation } from "./page";

const HEADER_HEIGHT = 28; // Height reserved for header section
const FOOTER_HEIGHT = 15; // Height reserved for footer section

/**
 * Draw institutional letterhead header
 * Based on "dovita" official letterhead format:
 * - Logo on left
 * - Company name and address on right
 */
export async function drawHeader(
  doc: jsPDF,
  brand: CorporateBrand,
  options: { orientation: PageOrientation }
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const startY = 10;

  // Logo on left side
  if (brand.logoUrl) {
    try {
      // Logo dimensions: ~35mm width, 18mm height for good visibility
      doc.addImage(brand.logoUrl, "PNG", 10, startY, 35, 18);
    } catch (e) {
      console.error("Error loading logo for PDF:", e);
    }
  }

  // Company info on right side - matching letterhead format
  const rightX = pageWidth - 10;
  let rightY = startY + 3;

  // Company name (bold, primary color)
  const primaryRgb = hexToRgb(brand.colorPrimario);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(brand.razonSocial, rightX, rightY, { align: "right" });

  // Tagline or subtitle if available (normal, smaller)
  rightY += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("De terreno a casa sin estrés", rightX, rightY, { align: "right" });

  // Address (if available)
  if (brand.domicilio) {
    rightY += 4;
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    
    // Split long addresses into multiple lines if needed
    const maxWidth = 90;
    const addressLines = doc.splitTextToSize(brand.domicilio, maxWidth);
    addressLines.forEach((line: string) => {
      doc.text(line, rightX, rightY, { align: "right" });
      rightY += 3.5;
    });
  }

  // Website (if available)
  if (brand.sitioWeb) {
    rightY += 1;
    doc.setFontSize(7);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(brand.sitioWeb, rightX, rightY, { align: "right" });
  }

  // Draw subtle separator line
  const separatorY = startY + HEADER_HEIGHT;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(10, separatorY, pageWidth - 10, separatorY);

  return separatorY + 5; // Return Y position where content can start
}

/**
 * Draw institutional footer
 * Contains pagination and contact info
 */
export function drawFooter(
  doc: jsPDF,
  brand: CorporateBrand,
  options: { pageNumber: number; totalPages?: number }
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 10;

  // Subtle separator line above footer
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(10, footerY - 5, pageWidth - 10, footerY - 5);

  // Footer text
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");

  // Left side: Website or contact info
  const leftText = brand.sitioWeb || brand.telefono || brand.emailPrincipal;
  if (leftText) {
    doc.text(leftText, 10, footerY);
  }

  // Center: Company name
  doc.text(brand.razonSocial, pageWidth / 2, footerY, { align: "center" });

  // Right side: Page number
  const pageText = options.totalPages
    ? `Página ${options.pageNumber} de ${options.totalPages}`
    : `Página ${options.pageNumber}`;
  doc.text(pageText, pageWidth - 10, footerY, { align: "right" });
}

/**
 * Get the usable content area Y bounds considering header and footer
 */
export function getContentBounds(doc: jsPDF): {
  startY: number;
  endY: number;
  availableHeight: number;
} {
  const pageHeight = doc.internal.pageSize.getHeight();
  const startY = 10 + HEADER_HEIGHT + 5; // Header + separator + margin
  const endY = pageHeight - FOOTER_HEIGHT - 5; // Footer + margin

  return {
    startY,
    endY,
    availableHeight: endY - startY,
  };
}
