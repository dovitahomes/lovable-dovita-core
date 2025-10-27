import { XMLParser } from 'fast-xml-parser';

interface CfdiConcepto {
  claveProdServ?: string;
  descripcion: string;
  cantidad: number;
  unidad?: string;
  valorUnitario: number;
  importe: number;
  impuestos?: any;
}

interface CfdiResult {
  version: string;
  tipoComprobante: string;
  formaPago?: string;
  metodoPago?: string;
  moneda: string;
  tipoCambio?: number;
  subtotal: number;
  descuento?: number;
  total: number;
  serie?: string;
  folio?: string;
  fecha: Date;
  impuestos: {
    trasladados: number;
    retenidos: number;
  };
  emisor: {
    rfc: string;
    nombre: string;
    regimenFiscal: string;
  };
  receptor: {
    rfc: string;
    nombre: string;
    usoCfdi?: string;
    domicilioFiscal?: string;
    regimenFiscal?: string;
  };
  timbre: {
    uuid: string;
    fechaTimbrado: Date;
    selloSat?: string;
    noCertificadoSat?: string;
  };
  conceptos: CfdiConcepto[];
}

export function parseCfdiXml(xmlContent: string): CfdiResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true
  });

  const parsed = parser.parse(xmlContent);

  // Support both CFDI 3.3 and 4.0
  const comprobante = parsed['cfdi:Comprobante'] || parsed['Comprobante'];
  if (!comprobante) {
    throw new Error('No se encontró el nodo Comprobante en el XML');
  }

  const attrs = comprobante['@_'] || comprobante;
  
  // Emisor
  const emisorNode = comprobante['cfdi:Emisor'] || comprobante['Emisor'];
  const emisorAttrs = emisorNode?.['@_'] || emisorNode || {};

  // Receptor
  const receptorNode = comprobante['cfdi:Receptor'] || comprobante['Receptor'];
  const receptorAttrs = receptorNode?.['@_'] || receptorNode || {};

  // Conceptos
  const conceptosNode = comprobante['cfdi:Conceptos'] || comprobante['Conceptos'];
  let conceptosArray = conceptosNode?.['cfdi:Concepto'] || conceptosNode?.['Concepto'] || [];
  if (!Array.isArray(conceptosArray)) {
    conceptosArray = [conceptosArray];
  }

  const conceptos: CfdiConcepto[] = conceptosArray.map((c: any) => {
    const cAttrs = c['@_'] || c;
    return {
      claveProdServ: cAttrs.ClaveProdServ,
      descripcion: cAttrs.Descripcion || '',
      cantidad: parseFloat(cAttrs.Cantidad || '0'),
      unidad: cAttrs.ClaveUnidad || cAttrs.Unidad,
      valorUnitario: parseFloat(cAttrs.ValorUnitario || '0'),
      importe: parseFloat(cAttrs.Importe || '0'),
      impuestos: c['cfdi:Impuestos'] || c['Impuestos']
    };
  });

  // Impuestos
  const impuestosNode = comprobante['cfdi:Impuestos'] || comprobante['Impuestos'];
  const impuestosAttrs = impuestosNode?.['@_'] || impuestosNode || {};
  const trasladados = parseFloat(impuestosAttrs.TotalImpuestosTrasladados || '0');
  const retenidos = parseFloat(impuestosAttrs.TotalImpuestosRetenidos || '0');

  // Timbre Fiscal Digital
  const complementoNode = comprobante['cfdi:Complemento'] || comprobante['Complemento'];
  const timbreNode = complementoNode?.['tfd:TimbreFiscalDigital'] || 
                     complementoNode?.['TimbreFiscalDigital'];
  const timbreAttrs = timbreNode?.['@_'] || timbreNode || {};

  if (!timbreAttrs.UUID) {
    throw new Error('No se encontró el UUID del timbre fiscal');
  }

  return {
    version: attrs.Version || '4.0',
    tipoComprobante: attrs.TipoDeComprobante || 'I',
    formaPago: attrs.FormaPago,
    metodoPago: attrs.MetodoPago,
    moneda: attrs.Moneda || 'MXN',
    tipoCambio: attrs.TipoCambio ? parseFloat(attrs.TipoCambio) : undefined,
    subtotal: parseFloat(attrs.SubTotal || '0'),
    descuento: attrs.Descuento ? parseFloat(attrs.Descuento) : undefined,
    total: parseFloat(attrs.Total || '0'),
    serie: attrs.Serie,
    folio: attrs.Folio,
    fecha: new Date(attrs.Fecha),
    impuestos: {
      trasladados,
      retenidos
    },
    emisor: {
      rfc: emisorAttrs.Rfc || emisorAttrs.RFC || '',
      nombre: emisorAttrs.Nombre || '',
      regimenFiscal: emisorAttrs.RegimenFiscal || ''
    },
    receptor: {
      rfc: receptorAttrs.Rfc || receptorAttrs.RFC || '',
      nombre: receptorAttrs.Nombre || '',
      usoCfdi: receptorAttrs.UsoCFDI,
      domicilioFiscal: receptorAttrs.DomicilioFiscalReceptor,
      regimenFiscal: receptorAttrs.RegimenFiscalReceptor
    },
    timbre: {
      uuid: timbreAttrs.UUID,
      fechaTimbrado: new Date(timbreAttrs.FechaTimbrado),
      selloSat: timbreAttrs.SelloSAT,
      noCertificadoSat: timbreAttrs.NoCertificadoSAT
    },
    conceptos
  };
}
