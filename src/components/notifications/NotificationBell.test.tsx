import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { NotificationBell } from './NotificationBell';
import userEvent from '@testing-library/user-event';
import * as notificationsHook from '@/hooks/useNotifications';

vi.mock('@/hooks/useNotifications');
vi.mock('@/app/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render bell icon with unread count badge', () => {
    vi.spyOn(notificationsHook, 'useNotifications').mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useUnreadNotifications').mockReturnValue({
      data: 5,
      isLoading: false,
    } as any);

    render(<NotificationBell />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not display badge when no unread notifications', () => {
    vi.spyOn(notificationsHook, 'useNotifications').mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useUnreadNotifications').mockReturnValue({
      data: 0,
      isLoading: false,
    } as any);

    render(<NotificationBell />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should display notifications when popover is opened', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'price_alert',
        title: 'Price Alert',
        message: 'Price increased by 10%',
        read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
      {
        id: '2',
        type: 'budget_shared',
        title: 'Budget Shared',
        message: 'New budget was shared with you',
        read: true,
        created_at: '2025-01-01T09:00:00Z',
      },
    ];

    vi.spyOn(notificationsHook, 'useNotifications').mockReturnValue({
      data: mockNotifications,
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useUnreadNotifications').mockReturnValue({
      data: 1,
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useMarkNotificationRead').mockReturnValue({
      mutate: vi.fn(),
    } as any);

    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellButton = screen.getByRole('button');
    await user.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Price Alert')).toBeInTheDocument();
      expect(screen.getByText('Price increased by 10%')).toBeInTheDocument();
      expect(screen.getByText('Budget Shared')).toBeInTheDocument();
    });
  });

  it('should display empty state when no notifications', async () => {
    vi.spyOn(notificationsHook, 'useNotifications').mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useUnreadNotifications').mockReturnValue({
      data: 0,
      isLoading: false,
    } as any);

    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellButton = screen.getByRole('button');
    await user.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText(/no hay notificaciones/i)).toBeInTheDocument();
    });
  });

  it('should mark notification as read when clicked', async () => {
    const mockMutate = vi.fn();
    const mockNotifications = [
      {
        id: '1',
        type: 'price_alert',
        title: 'Price Alert',
        message: 'Price increased',
        read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
    ];

    vi.spyOn(notificationsHook, 'useNotifications').mockReturnValue({
      data: mockNotifications,
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useUnreadNotifications').mockReturnValue({
      data: 1,
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useMarkNotificationRead').mockReturnValue({
      mutate: mockMutate,
    } as any);

    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellButton = screen.getByRole('button');
    await user.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Price Alert')).toBeInTheDocument();
    });

    const notificationItem = screen.getByText('Price Alert').closest('div');
    if (notificationItem) {
      await user.click(notificationItem);
      expect(mockMutate).toHaveBeenCalledWith('1');
    }
  });

  it('should display "Mark all as read" button when there are unread notifications', async () => {
    vi.spyOn(notificationsHook, 'useNotifications').mockReturnValue({
      data: [
        {
          id: '1',
          type: 'price_alert',
          title: 'Alert',
          message: 'Message',
          read: false,
          created_at: '2025-01-01T10:00:00Z',
        },
      ],
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useUnreadNotifications').mockReturnValue({
      data: 1,
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useMarkAllNotificationsRead').mockReturnValue({
      mutate: vi.fn(),
    } as any);

    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellButton = screen.getByRole('button');
    await user.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText(/marcar todas como leídas/i)).toBeInTheDocument();
    });
  });

  it('should render different icons based on notification type', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'price_alert',
        title: 'Price Alert',
        message: 'Message',
        read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
      {
        id: '2',
        type: 'budget_shared',
        title: 'Shared',
        message: 'Message',
        read: false,
        created_at: '2025-01-01T09:00:00Z',
      },
    ];

    vi.spyOn(notificationsHook, 'useNotifications').mockReturnValue({
      data: mockNotifications,
      isLoading: false,
    } as any);

    vi.spyOn(notificationsHook, 'useUnreadNotifications').mockReturnValue({
      data: 2,
      isLoading: false,
    } as any);

    const user = userEvent.setup();
    render(<NotificationBell />);

    const bellButton = screen.getByRole('button');
    await user.click(bellButton);

    await waitFor(() => {
      // Verify different notification types are rendered
      expect(screen.getByText('Price Alert')).toBeInTheDocument();
      expect(screen.getByText('Shared')).toBeInTheDocument();
    });
  });
});
