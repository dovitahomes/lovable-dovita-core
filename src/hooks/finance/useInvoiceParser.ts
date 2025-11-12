import { useState } from "react";
import { XMLParser } from "fast-xml-parser";
import { toast } from "sonner";

interface ParsedInvoiceData {
  uuid_cfdi: string | null;
  folio: string | null;
  serie: string | null;
  fecha: string | null;
  subtotal: number;
  total: number;
  moneda: string;
  metodoPago: string;
  formaPago: string;
  emisor: {
    rfc: string | null;
    nombre: string | null;
    regimenFiscal: string | null;
  };
  receptor: {
    rfc: string | null;
    nombre: string | null;
    usoCFDI: string | null;
  };
  conceptos: any[];
  impuestos: {
    traslados: number;
    retenciones: number;
  };
}

export function useInvoiceParser() {
  const [parsing, setParsing] = useState(false);

  const parseXML = async (file: File): Promise<ParsedInvoiceData | null> => {
    setParsing(true);
    
    try {
      const text = await file.text();
      
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });
      
      const result = parser.parse(text);
      
      // Navegar la estructura del CFDI (puede variar según versión)
      const cfdi = result['cfdi:Comprobante'] || result['Comprobante'];
      
      if (!cfdi) {
        throw new Error('No se encontró estructura válida de CFDI');
      }

      const timbreFiscal = cfdi['cfdi:Complemento']?.['tfd:TimbreFiscalDigital'] || 
                          cfdi['Complemento']?.['TimbreFiscalDigital'];
      
      const emisor = cfdi['cfdi:Emisor'] || cfdi['Emisor'];
      const receptor = cfdi['cfdi:Receptor'] || cfdi['Receptor'];
      const impuestos = cfdi['cfdi:Impuestos'] || cfdi['Impuestos'];

      const parsed: ParsedInvoiceData = {
        uuid_cfdi: timbreFiscal?.['@_UUID'] || null,
        folio: cfdi['@_Folio'] || null,
        serie: cfdi['@_Serie'] || null,
        fecha: cfdi['@_Fecha'] || null,
        subtotal: parseFloat(cfdi['@_SubTotal'] || '0'),
        total: parseFloat(cfdi['@_Total'] || '0'),
        moneda: cfdi['@_Moneda'] || 'MXN',
        metodoPago: cfdi['@_MetodoPago'] || 'PUE',
        formaPago: cfdi['@_FormaPago'] || '99',
        emisor: {
          rfc: emisor?.['@_Rfc'] || null,
          nombre: emisor?.['@_Nombre'] || null,
          regimenFiscal: emisor?.['@_RegimenFiscal'] || null,
        },
        receptor: {
          rfc: receptor?.['@_Rfc'] || null,
          nombre: receptor?.['@_Nombre'] || null,
          usoCFDI: receptor?.['@_UsoCFDI'] || null,
        },
        conceptos: [],
        impuestos: {
          traslados: parseFloat(impuestos?.['@_TotalImpuestosTrasladados'] || '0'),
          retenciones: parseFloat(impuestos?.['@_TotalImpuestosRetenidos'] || '0'),
        },
      };

      toast.success('XML parseado correctamente');
      return parsed;
      
    } catch (error: any) {
      console.error('Error parsing XML:', error);
      toast.error('Error al parsear XML: ' + error.message);
      return null;
    } finally {
      setParsing(false);
    }
  };

  return {
    parseXML,
    parsing,
  };
}
