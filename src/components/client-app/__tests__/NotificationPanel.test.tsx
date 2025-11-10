import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import NotificationPanel from '../NotificationPanel';

expect.extend(toHaveNoViolations);

const mockNotifications = [
  {
    id: '1',
    title: 'Nuevo mensaje',
    message: 'Tienes un mensaje nuevo',
    type: 'chat' as const,
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Evento próximo',
    message: 'Tu cita es mañana',
    type: 'calendar' as const,
    read: true,
    created_at: new Date().toISOString(),
  },
];

const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();

vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: 1,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
  }),
}));

describe('NotificationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notifications list', () => {
    render(<NotificationPanel open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument();
    expect(screen.getByText('Evento próximo')).toBeInTheDocument();
  });

  it('should display unread count', () => {
    render(<NotificationPanel open={true} onOpenChange={() => {}} />);

    expect(screen.getByText(/1 nueva/i)).toBeInTheDocument();
  });

  it('should mark notification as read when clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationPanel open={true} onOpenChange={() => {}} />);

    const notification = screen.getByText('Nuevo mensaje');
    await user.click(notification.closest('button')!);

    expect(mockMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('should mark all as read when button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationPanel open={true} onOpenChange={() => {}} />);

    const markAllButton = screen.getByRole('button', { name: /marcar todas como leídas/i });
    await user.click(markAllButton);

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('should have proper ARIA attributes', () => {
    render(<NotificationPanel open={true} onOpenChange={() => {}} />);

    const heading = screen.getByRole('heading', { name: /notificaciones/i });
    expect(heading).toBeInTheDocument();
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<NotificationPanel open={true} onOpenChange={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show empty state when no notifications', () => {
    vi.mock('@/contexts/NotificationContext', () => ({
      useNotifications: () => ({
        notifications: [],
        unreadCount: 0,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      }),
    }));

    render(<NotificationPanel open={true} onOpenChange={() => {}} />);

    expect(screen.getByText(/no tienes notificaciones/i)).toBeInTheDocument();
  });
});
