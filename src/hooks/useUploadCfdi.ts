import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadToBucket, deleteFromBucket } from "@/lib/storage/storage-helpers";

interface CfdiUploadData {
  invoiceId?: string;
  xmlFile: File;
  pdfFile?: File;
  emisorId: string;
  receptorId?: string;
  projectId?: string;
}

interface CfdiMetadata {
  uuid?: string;
  version?: string;
  serie?: string;
  folio_number?: string;
  fecha_emision?: string;
  tipo_comprobante?: string;
  forma_pago?: string;
  metodo_pago?: string;
  moneda?: string;
  subtotal?: number;
  total?: number;
  emisor?: {
    rfc?: string;
    nombre?: string;
  };
  receptor?: {
    rfc?: string;
    nombre?: string;
  };
}

export function useUploadCfdi() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadCfdi = async (data: CfdiUploadData) => {
    setUploading(true);
    setProgress(0);

    let xmlPath: string | null = null;
    let pdfPath: string | null = null;

    try {
      // Validar que el archivo XML sea válido
      if (!data.xmlFile.name.toLowerCase().endsWith('.xml')) {
        throw new Error('El archivo debe ser XML');
      }

      if (data.pdfFile && !data.pdfFile.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('El archivo PDF debe tener extensión .pdf');
      }

      setProgress(20);

      // 1. Subir XML a bucket cfdi
      const xmlResult = await uploadToBucket({
        bucket: 'cfdi',
        projectId: data.emisorId,
        file: data.xmlFile,
      });
      xmlPath = xmlResult.path;

      setProgress(40);

      // 2. Subir PDF si existe
      if (data.pdfFile) {
        const pdfResult = await uploadToBucket({
          bucket: 'cfdi',
          projectId: data.emisorId,
          file: data.pdfFile,
        });
        pdfPath = pdfResult.path;
      }

      setProgress(60);

      // 3. Leer contenido XML para extraer metadatos
      const xmlText = await data.xmlFile.text();

      setProgress(70);

      // 4. Llamar RPC extract_cfdi_metadata
      const { data: metadata, error: rpcError } = await supabase.rpc(
        'extract_cfdi_metadata',
        { xml_content: xmlText }
      );

      if (rpcError) {
        console.error('Error extrayendo metadatos:', rpcError);
        // Continuar sin metadatos si falla la extracción
      }

      setProgress(80);

      // 5. Crear o actualizar invoice
      const invoiceData = {
        emisor_id: data.emisorId,
        receptor_id: data.receptorId || null,
        project_id: data.projectId || null,
        xml_path: xmlPath,
        pdf_path: pdfPath || null,
        cfdi_metadata: metadata || {},
        folio: (metadata as CfdiMetadata)?.folio_number || 'Sin folio',
        issued_at: (metadata as CfdiMetadata)?.fecha_emision || new Date().toISOString(),
        total_amount: (metadata as CfdiMetadata)?.total || 0,
        tipo: 'egreso' as const,
        metodo_pago: ((metadata as CfdiMetadata)?.metodo_pago as 'PUE' | 'PPD') || 'PUE',
        paid: false,
      };

      if (data.invoiceId) {
        // Actualizar invoice existente
        const { error: updateError } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', data.invoiceId);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo invoice
        const { error: insertError } = await supabase
          .from('invoices')
          .insert([invoiceData]);

        if (insertError) throw insertError;
      }

      setProgress(100);
      toast.success('CFDI cargado exitosamente');

      return {
        xmlPath,
        pdfPath,
        metadata: metadata as CfdiMetadata,
      };
    } catch (error: any) {
      console.error('Error uploading CFDI:', error);
      
      // Cleanup: eliminar archivos subidos si hubo error
      if (xmlPath) {
        try {
          await deleteFromBucket('cfdi', xmlPath);
        } catch (cleanupError) {
          console.error('Error cleaning up XML:', cleanupError);
        }
      }
      
      if (pdfPath) {
        try {
          await deleteFromBucket('cfdi', pdfPath);
        } catch (cleanupError) {
          console.error('Error cleaning up PDF:', cleanupError);
        }
      }

      toast.error(`Error al cargar CFDI: ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadCfdi,
    uploading,
    progress,
  };
}