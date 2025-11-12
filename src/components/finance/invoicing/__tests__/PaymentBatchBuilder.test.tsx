import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { PaymentBatchBuilder } from '../PaymentBatchBuilder';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/hooks/finance/useInvoices', () => ({
  useInvoices: vi.fn(() => ({
    data: [
      {
        id: 'inv-1',
        emisor: { name: 'Proveedor A' },
        total_amount: 1000,
        folio: 'F-001',
      },
      {
        id: 'inv-2',
        emisor: { name: 'Proveedor B' },
        total_amount: 2000,
        folio: 'F-002',
      },
    ],
    isLoading: false,
  })),
}));

vi.mock('@/hooks/usePaymentBatches', () => ({
  useCreatePaymentBatch: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  })),
  useAddInvoiceToPaymentBatch: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: any) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('PaymentBatchBuilder', () => {
  it('should render available invoices', () => {
    render(<PaymentBatchBuilder />, { wrapper: createWrapper() });

    expect(screen.getByText('Facturas Disponibles')).toBeInTheDocument();
    expect(screen.getByText('Proveedor A')).toBeInTheDocument();
    expect(screen.getByText('Proveedor B')).toBeInTheDocument();
  });

  it('should render batch configuration form', () => {
    render(<PaymentBatchBuilder />, { wrapper: createWrapper() });

    expect(screen.getByLabelText('Nombre del Lote')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha Programada (opcional)')).toBeInTheDocument();
  });

  it('should display drop zone', () => {
    render(<PaymentBatchBuilder />, { wrapper: createWrapper() });

    expect(screen.getByText('Facturas en el Lote')).toBeInTheDocument();
    expect(screen.getByText('Arrastra facturas aquí')).toBeInTheDocument();
  });

  it('should allow entering batch name', async () => {
    const user = userEvent.setup();
    render(<PaymentBatchBuilder />, { wrapper: createWrapper() });

    const input = screen.getByLabelText('Nombre del Lote');
    await user.type(input, 'Lote de Prueba');

    expect(input).toHaveValue('Lote de Prueba');
  });

  it('should display summary section', () => {
    render(<PaymentBatchBuilder />, { wrapper: createWrapper() });

    expect(screen.getByText('Resumen de Dispersión')).toBeInTheDocument();
    expect(screen.getByText('Total de facturas:')).toBeInTheDocument();
    expect(screen.getByText('Proveedores únicos:')).toBeInTheDocument();
    expect(screen.getByText('Monto Total:')).toBeInTheDocument();
  });

  it('should render export buttons', () => {
    render(<PaymentBatchBuilder />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /Excel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TXT/i })).toBeInTheDocument();
  });

  it('should display create batch button', () => {
    render(<PaymentBatchBuilder />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /Crear Lote/i })).toBeInTheDocument();
  });
});
