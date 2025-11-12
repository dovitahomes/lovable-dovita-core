import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoiceParser } from '../useInvoiceParser';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useInvoiceParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse valid XML successfully', async () => {
    const validXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <cfdi:Comprobante
        xmlns:cfdi="http://www.sat.gob.mx/cfd/3"
        xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
        Folio="12345"
        Fecha="2024-01-15T10:30:00"
        SubTotal="1000.00"
        Total="1160.00"
        Moneda="MXN"
        MetodoPago="PUE"
        FormaPago="03"
      >
        <cfdi:Emisor Rfc="XAXX010101000" Nombre="Proveedor Test" RegimenFiscal="601"/>
        <cfdi:Receptor Rfc="YAYY020202000" Nombre="Receptor Test" UsoCFDI="G03"/>
        <cfdi:Complemento>
          <tfd:TimbreFiscalDigital UUID="12345678-1234-1234-1234-123456789ABC"/>
        </cfdi:Complemento>
        <cfdi:Impuestos TotalImpuestosTrasladados="160.00"/>
      </cfdi:Comprobante>
    `;

    const file = new File([validXML], 'test.xml', { type: 'text/xml' });
    const { result } = renderHook(() => useInvoiceParser());

    let parsedData;
    await act(async () => {
      parsedData = await result.current.parseXML(file);
    });

    expect(parsedData).toMatchObject({
      folio: '12345',
      subtotal: 1000,
      total: 1160,
      moneda: 'MXN',
      metodoPago: 'PUE',
      formaPago: '03',
    });
    expect(parsedData?.uuid_cfdi).toBe('12345678-1234-1234-1234-123456789ABC');
    expect(parsedData?.emisor.rfc).toBe('XAXX010101000');
    expect(parsedData?.receptor.rfc).toBe('YAYY020202000');
    expect(toast.success).toHaveBeenCalledWith('XML parseado correctamente');
  });

  it('should handle invalid XML structure', async () => {
    const invalidXML = '<invalid>Not a CFDI</invalid>';
    const file = new File([invalidXML], 'test.xml', { type: 'text/xml' });
    const { result } = renderHook(() => useInvoiceParser());

    let parsedData;
    await act(async () => {
      parsedData = await result.current.parseXML(file);
    });

    expect(parsedData).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should set parsing state correctly', async () => {
    const validXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/3" Total="1000">
        <cfdi:Emisor Rfc="TEST"/>
        <cfdi:Receptor Rfc="TEST"/>
      </cfdi:Comprobante>
    `;
    const file = new File([validXML], 'test.xml', { type: 'text/xml' });
    const { result } = renderHook(() => useInvoiceParser());

    expect(result.current.parsing).toBe(false);

    const parsePromise = act(async () => {
      await result.current.parseXML(file);
    });

    await parsePromise;
    expect(result.current.parsing).toBe(false);
  });

  it('should handle missing optional fields', async () => {
    const minimalXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/3" SubTotal="1000" Total="1000">
        <cfdi:Emisor Rfc="TEST"/>
        <cfdi:Receptor Rfc="TEST"/>
      </cfdi:Comprobante>
    `;
    const file = new File([minimalXML], 'test.xml', { type: 'text/xml' });
    const { result } = renderHook(() => useInvoiceParser());

    let parsedData;
    await act(async () => {
      parsedData = await result.current.parseXML(file);
    });

    expect(parsedData?.uuid_cfdi).toBeNull();
    expect(parsedData?.folio).toBeNull();
    expect(parsedData?.subtotal).toBe(1000);
    expect(parsedData?.total).toBe(1000);
  });
});
