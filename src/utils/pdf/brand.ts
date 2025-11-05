import { supabase } from "@/integrations/supabase/client";

export interface CorporateBrand {
  logoUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
  razonSocial: string;
  domicilio: string;
  telefono: string;
  sitioWeb: string;
  emailPrincipal: string;
}

/**
 * Fetch corporate branding information from CMS
 * Generates signed URL for logo if it's in storage
 */
export async function fetchCorporateBrand(): Promise<CorporateBrand> {
  const { data, error } = await supabase
    .from("contenido_corporativo")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching corporate content:", error);
  }

  // Default values
  const defaults = {
    logoUrl: null,
    colorPrimario: "#1e40af",
    colorSecundario: "#059669",
    razonSocial: "DOVITA",
    domicilio: "",
    telefono: "",
    sitioWeb: "",
    emailPrincipal: "",
  };

  if (!data) return defaults;

  // Handle logo URL - check if it's a storage path
  let logoUrl = data.logo_url;
  if (logoUrl && logoUrl.startsWith("contenido/")) {
    try {
      const { data: signedData } = await supabase.storage
        .from("contenido")
        .createSignedUrl(logoUrl.replace("contenido/", ""), 3600); // 1 hour expiry
      
      if (signedData?.signedUrl) {
        logoUrl = signedData.signedUrl;
      }
    } catch (e) {
      console.error("Error generating signed URL for logo:", e);
    }
  }

  return {
    logoUrl,
    colorPrimario: data.color_primario || defaults.colorPrimario,
    colorSecundario: data.color_secundario || defaults.colorSecundario,
    razonSocial: data.nombre_empresa || defaults.razonSocial,
    domicilio: data.direccion || defaults.domicilio,
    telefono: data.telefono_principal || defaults.telefono,
    sitioWeb: data.sitio_web || defaults.sitioWeb,
    emailPrincipal: data.email_principal || defaults.emailPrincipal,
  };
}

/**
 * Convert hex color to RGB tuple for jsPDF
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [30, 64, 175]; // Default blue
}
