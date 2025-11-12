import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test/test-utils';
import { useTUStats } from './useTUStats';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('useTUStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return TU stats with correct counts by type', async () => {
    const mockNodes = [
      { id: '1', type: 'departamento' },
      { id: '2', type: 'departamento' },
      { id: '3', type: 'mayor' },
      { id: '4', type: 'mayor' },
      { id: '5', type: 'mayor' },
      { id: '6', type: 'partida' },
      { id: '7', type: 'subpartida' },
      { id: '8', type: 'subpartida' },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockNodes,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useTUStats('global'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      total: { count: 8, nodeIds: ['1', '2', '3', '4', '5', '6', '7', '8'] },
      departamentos: { count: 2, nodeIds: ['1', '2'] },
      mayores: { count: 3, nodeIds: ['3', '4', '5'] },
      partidas: { count: 1, nodeIds: ['6'] },
      subpartidas: { count: 2, nodeIds: ['7', '8'] },
    });
  });

  it('should filter by scope correctly', async () => {
    const mockGlobalNodes = [
      { id: '1', type: 'mayor' },
      { id: '2', type: 'mayor' },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockGlobalNodes,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useTUStats('sucursal'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that eq was called with correct scope filter
    expect(supabase.from).toHaveBeenCalledWith('tu_nodes');
    const selectMock = vi.mocked(supabase.from('tu_nodes').select);
    expect(selectMock).toHaveBeenCalledWith('id, type');
  });

  it('should handle empty node list', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useTUStats('global'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      total: { count: 0, nodeIds: [] },
      departamentos: { count: 0, nodeIds: [] },
      mayores: { count: 0, nodeIds: [] },
      partidas: { count: 0, nodeIds: [] },
      subpartidas: { count: 0, nodeIds: [] },
    });
  });

  it('should handle database errors gracefully', async () => {
    const mockError = new Error('Database connection failed');

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useTUStats('global'));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(mockError);
  });

  it('should count only nodes of each specific type', async () => {
    const mockNodes = [
      { id: '1', type: 'departamento' },
      { id: '2', type: 'mayor' },
      { id: '3', type: 'mayor' },
      { id: '4', type: 'partida' },
      { id: '5', type: 'subpartida' },
      { id: '6', type: 'unknown_type' }, // Should not break counting
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockNodes,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useTUStats('proyecto'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.departamentos.count).toBe(1);
    expect(result.current.data?.mayores.count).toBe(2);
    expect(result.current.data?.partidas.count).toBe(1);
    expect(result.current.data?.subpartidas.count).toBe(1);
  });
});
