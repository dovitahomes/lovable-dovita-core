import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test/test-utils';
import { useBudgetStats } from './useBudgetStats';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('useBudgetStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return budget stats with correct counts', async () => {
    const mockBudgets = [
      { budget_id: '1', status: 'publicado', budget_total: 100000 },
      { budget_id: '2', status: 'publicado', budget_total: 200000 },
      { budget_id: '3', status: 'borrador', budget_total: 50000 },
      { budget_id: '4', status: 'borrador', budget_total: 75000 },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockBudgets,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useBudgetStats());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      total: {
        count: 4,
        budgetIds: ['1', '2', '3', '4'],
      },
      published: {
        count: 2,
        budgetIds: ['1', '2'],
      },
      draft: {
        count: 2,
        budgetIds: ['3', '4'],
      },
      totalValue: 300000,
    });
  });

  it('should calculate total value only from published budgets', async () => {
    const mockBudgets = [
      { budget_id: '1', status: 'publicado', budget_total: 100000 },
      { budget_id: '2', status: 'borrador', budget_total: 50000 }, // Should not be included in totalValue
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockBudgets,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useBudgetStats());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.totalValue).toBe(100000);
    expect(result.current.data?.published.count).toBe(1);
    expect(result.current.data?.draft.count).toBe(1);
  });

  it('should handle empty budget list', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useBudgetStats());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      total: { count: 0, budgetIds: [] },
      published: { count: 0, budgetIds: [] },
      draft: { count: 0, budgetIds: [] },
      totalValue: 0,
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

    const { result } = renderHook(() => useBudgetStats());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(mockError);
  });

  it('should handle null budget_total values', async () => {
    const mockBudgets = [
      { budget_id: '1', status: 'publicado', budget_total: null },
      { budget_id: '2', status: 'publicado', budget_total: 100000 },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockBudgets,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useBudgetStats());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.totalValue).toBe(100000);
  });
});
