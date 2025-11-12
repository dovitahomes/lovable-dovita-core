import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test/test-utils';
import { useProviderStats } from './useProviderStats';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('useProviderStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return provider stats with correct counts', async () => {
    const mockProviders = [
      { id: '1', code_short: 'PRV1', activo: true, terms_json: { tiempo_entrega: '5 días' } },
      { id: '2', code_short: 'PRV2', activo: true, terms_json: { forma_pago: 'Contado' } },
      { id: '3', code_short: 'PRV3', activo: false, terms_json: {} },
      { id: '4', code_short: 'PRV4', activo: true, terms_json: {} },
    ];

    const mockUsageData = [
      { provider_id: '1' },
      { provider_id: '2' },
    ];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'providers') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockProviders,
            error: null,
          }),
        } as any;
      }
      if (table === 'budget_items') {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: mockUsageData,
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useProviderStats());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total.count).toBe(4);
    expect(result.current.data?.active.count).toBe(3);
    expect(result.current.data?.withTerms.count).toBe(2);
    expect(result.current.data?.usedInBudgets.count).toBe(2);
  });

  it('should correctly identify providers with terms', async () => {
    const mockProviders = [
      { id: '1', activo: true, terms_json: { tiempo_entrega: '5 días', forma_pago: '', condiciones: '' } },
      { id: '2', activo: true, terms_json: { tiempo_entrega: '', forma_pago: 'Contado', condiciones: '' } },
      { id: '3', activo: true, terms_json: { tiempo_entrega: '', forma_pago: '', condiciones: 'Terms' } },
      { id: '4', activo: true, terms_json: { tiempo_entrega: '', forma_pago: '', condiciones: '' } },
      { id: '5', activo: true, terms_json: null },
    ];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'providers') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockProviders,
            error: null,
          }),
        } as any;
      }
      if (table === 'budget_items') {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useProviderStats());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should count providers with at least one non-empty term
    expect(result.current.data?.withTerms.count).toBe(3);
  });

  it('should handle empty provider list', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'providers') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        } as any;
      }
      if (table === 'budget_items') {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useProviderStats());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      total: { count: 0, providerIds: [] },
      active: { count: 0, providerIds: [] },
      withTerms: { count: 0, providerIds: [] },
      usedInBudgets: { count: 0, providerIds: [] },
    });
  });

  it('should handle database errors gracefully', async () => {
    const mockError = new Error('Database connection failed');

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    } as any);

    const { result } = renderHook(() => useProviderStats());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(mockError);
  });
});
