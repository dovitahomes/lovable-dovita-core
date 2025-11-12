import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test/test-utils';
import { useNotifications, useUnreadNotifications, useMarkNotificationRead } from './useNotifications';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch notifications for a user', async () => {
    const mockNotifications = [
      {
        id: '1',
        user_id: 'user-1',
        type: 'price_alert',
        title: 'Price Alert',
        message: 'Price increased',
        read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
      {
        id: '2',
        user_id: 'user-1',
        type: 'budget_shared',
        title: 'Budget Shared',
        message: 'New budget shared',
        read: true,
        created_at: '2025-01-01T09:00:00Z',
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockNotifications,
            error: null,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useNotifications('user-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].type).toBe('price_alert');
    expect(result.current.data?.[1].type).toBe('budget_shared');
  });

  it('should return undefined when no userId is provided', async () => {
    const { result } = renderHook(() => useNotifications(undefined));

    expect(result.current.data).toBeUndefined();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    const mockError = new Error('Database connection failed');

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useNotifications('user-1'));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(mockError);
  });
});

describe('useUnreadNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should count unread notifications', async () => {
    const mockData = [{ count: 5 }];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData[0],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useUnreadNotifications('user-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBe(5);
  });

  it('should return 0 when no unread notifications', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useUnreadNotifications('user-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBe(0);
  });
});

describe('useMarkNotificationRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark a notification as read', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useMarkNotificationRead());

    await result.current.mutateAsync('notification-1');

    expect(supabase.from).toHaveBeenCalledWith('notifications');
  });

  it('should handle errors when marking as read', async () => {
    const mockError = new Error('Update failed');

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useMarkNotificationRead());

    await expect(result.current.mutateAsync('notification-1')).rejects.toThrow('Update failed');
  });
});
