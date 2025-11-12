import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useInvoices, useInvoiceStats, useMarkInvoiceAsPaid } from '../useInvoices';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: any) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch invoices with filters', async () => {
    const mockData = [
      { id: '1', tipo: 'egreso', total_amount: 1000, paid: false },
      { id: '2', tipo: 'egreso', total_amount: 2000, paid: true },
    ];

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const { result } = renderHook(
      () => useInvoices({ tipo: 'egreso', paid: false }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('should handle fetch errors', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const { result } = renderHook(() => useInvoices(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useInvoiceStats', () => {
  it('should calculate stats correctly', async () => {
    const mockInvoices = [
      { tipo: 'ingreso', total_amount: 5000, paid: false, issued_at: new Date().toISOString() },
      { tipo: 'egreso', total_amount: 3000, paid: false, issued_at: new Date().toISOString() },
      { tipo: 'ingreso', total_amount: 2000, paid: true, issued_at: new Date().toISOString() },
    ];

    const mockQuery = {
      select: vi.fn().mockResolvedValue({ data: mockInvoices, error: null }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const { result } = renderHook(() => useInvoiceStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toMatchObject({
      totalCobrar: 5000,
      totalPagar: 3000,
      totalPendientes: 2,
      totalPagadas: 1,
      totalFacturas: 3,
    });
  });
});

describe('useMarkInvoiceAsPaid', () => {
  it('should mark invoice as paid successfully', async () => {
    const mockUpdate = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    (supabase.from as any).mockReturnValue(mockUpdate);

    const { result } = renderHook(() => useMarkInvoiceAsPaid(), { wrapper: createWrapper() });

    await result.current.mutateAsync('invoice-123');

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Factura marcada como pagada'));
  });

  it('should handle errors when marking as paid', async () => {
    const mockUpdate = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
    };

    (supabase.from as any).mockReturnValue(mockUpdate);

    const { result } = renderHook(() => useMarkInvoiceAsPaid(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync('invoice-123')).rejects.toThrow();
  });
});
