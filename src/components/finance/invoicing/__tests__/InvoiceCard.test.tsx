import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvoiceCard } from '../InvoiceCard';

describe('InvoiceCard', () => {
  const mockInvoice = {
    id: '1',
    uuid_cfdi: '12345678-1234-1234-1234-123456789ABC',
    tipo: 'egreso' as const,
    emisor_id: 'prov-1',
    receptor_id: 'client-1',
    project_id: null,
    total_amount: 15000,
    subtotal: 12931.03,
    iva_amount: 2068.97,
    issued_at: '2024-01-15T10:30:00',
    paid: false,
    folio: 'F-12345',
    xml_path: null,
    pdf_path: null,
    cfdi_metadata: null,
    metodo_pago: 'PUE' as const,
    created_at: '2024-01-15T10:30:00',
    updated_at: '2024-01-15T10:30:00',
    emisor: {
      id: 'prov-1',
      name: 'Proveedor Test',
      code_short: 'PROVTE',
    },
    receptor: null,
  };

  it('should render invoice information correctly', () => {
    const mockOnMarkPaid = vi.fn();
    render(<InvoiceCard invoice={mockInvoice} onMarkPaid={mockOnMarkPaid} />);

    expect(screen.getByText('Proveedor Test')).toBeInTheDocument();
    expect(screen.getByText('F-12345')).toBeInTheDocument();
    expect(screen.getByText(/\$15,000\.00/)).toBeInTheDocument();
  });

  it('should display paid badge when invoice is paid', () => {
    const paidInvoice = { ...mockInvoice, paid: true };
    const mockOnMarkPaid = vi.fn();
    render(<InvoiceCard invoice={paidInvoice} onMarkPaid={mockOnMarkPaid} />);

    expect(screen.getByText('Pagada')).toBeInTheDocument();
  });

  it('should display pending badge when invoice is not paid', () => {
    const mockOnMarkPaid = vi.fn();
    render(<InvoiceCard invoice={mockInvoice} onMarkPaid={mockOnMarkPaid} />);

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('should show "Sin proveedor" when emisor is missing', () => {
    const invoiceWithoutEmisor = { ...mockInvoice, emisor: null };
    const mockOnMarkPaid = vi.fn();
    render(<InvoiceCard invoice={invoiceWithoutEmisor} onMarkPaid={mockOnMarkPaid} />);

    expect(screen.getByText('Sin proveedor')).toBeInTheDocument();
  });

  it('should display invoice type badge', () => {
    const mockOnMarkPaid = vi.fn();
    render(<InvoiceCard invoice={mockInvoice} onMarkPaid={mockOnMarkPaid} />);

    expect(screen.getByText('Egreso')).toBeInTheDocument();
  });
});
