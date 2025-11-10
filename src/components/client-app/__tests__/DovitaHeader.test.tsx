import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import DovitaHeader from '../DovitaHeader';

expect.extend(toHaveNoViolations);

// Mock contexts
vi.mock('@/contexts/client-app/ProjectContext', () => ({
  useProject: () => ({
    currentProject: {
      id: '1',
      name: 'Test Project',
    },
    setCurrentProject: vi.fn(),
  }),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
}));

describe('DovitaHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with logo and navigation', () => {
    render(<DovitaHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByAltText('Dovita Logo')).toBeInTheDocument();
  });

  it('should have skip to main content link', () => {
    render(<DovitaHeader />);

    const skipLink = screen.getByText('Ir al contenido principal');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should open search when search button is clicked', async () => {
    const user = userEvent.setup();
    render(<DovitaHeader />);

    const searchButton = screen.getByLabelText('Buscar');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
    });
  });

  it('should open notifications when bell icon is clicked', async () => {
    const user = userEvent.setup();
    render(<DovitaHeader />);

    const notificationButton = screen.getByLabelText('Notificaciones');
    await user.click(notificationButton);

    await waitFor(() => {
      expect(screen.getByText(/notificaciones/i)).toBeInTheDocument();
    });
  });

  it('should open menu when menu button is clicked', async () => {
    const user = userEvent.setup();
    render(<DovitaHeader />);

    const menuButton = screen.getByLabelText('Menú principal');
    await user.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText(/mi perfil/i)).toBeInTheDocument();
    });
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<DovitaHeader />);

    const searchButton = screen.getByLabelText('Buscar');
    
    searchButton.focus();
    expect(searchButton).toHaveFocus();

    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
    });
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<DovitaHeader />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
