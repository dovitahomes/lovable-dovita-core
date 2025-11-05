import type jsPDF from "jspdf";

export type PageOrientation = "portrait" | "landscape";

export interface PageConfig {
  size: "letter";
  orientation: PageOrientation;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Standard page configurations for institutional PDFs
 * Margins in points (1 pt ≈ 0.0139 inches)
 * Letter size: 8.5" x 11" = 612 x 792 pts (portrait)
 */
export const PAGE_CONFIGS: Record<string, PageConfig> = {
  PORTRAIT: {
    size: "letter",
    orientation: "portrait",
    margins: {
      top: 36, // ~0.5 inches
      right: 36,
      bottom: 48, // ~0.67 inches (more space for footer)
      left: 36,
    },
  },
  LANDSCAPE: {
    size: "letter",
    orientation: "landscape",
    margins: {
      top: 36,
      right: 36,
      bottom: 48,
      left: 36,
    },
  },
};

/**
 * Typography helpers
 */
export const TYPOGRAPHY = {
  title: { size: 14, style: "bold" as const },
  subtitle: { size: 11, style: "bold" as const },
  heading: { size: 10, style: "bold" as const },
  body: { size: 9, style: "normal" as const },
  small: { size: 8, style: "normal" as const },
  tiny: { size: 7, style: "normal" as const },
};

/**
 * Get usable content area dimensions
 */
export function getContentArea(doc: jsPDF, config: PageConfig) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  return {
    width: pageWidth - config.margins.left - config.margins.right,
    height: pageHeight - config.margins.top - config.margins.bottom,
    startX: config.margins.left,
    startY: config.margins.top,
    endX: pageWidth - config.margins.right,
    endY: pageHeight - config.margins.bottom,
  };
}

/**
 * Apply typography style to document
 */
export function applyTypography(
  doc: jsPDF,
  type: keyof typeof TYPOGRAPHY
) {
  const style = TYPOGRAPHY[type];
  doc.setFontSize(style.size);
  doc.setFont("helvetica", style.style);
}
