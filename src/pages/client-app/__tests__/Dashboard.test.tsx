import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import Dashboard from '../Dashboard';

expect.extend(toHaveNoViolations);

// Mock hooks
vi.mock('@/contexts/client-app/ProjectContext', () => ({
  useProject: () => ({
    currentProject: {
      id: '1',
      name: 'Test Project',
    },
  }),
}));

vi.mock('@/hooks/useClientUpcomingEvents', () => ({
  default: () => ({
    data: [
      {
        id: '1',
        title: 'Cita de prueba',
        start_at: new Date().toISOString(),
        type: 'appointment',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useClientRecentMessages', () => ({
  default: () => ({
    data: [
      {
        id: '1',
        content: 'Mensaje de prueba',
        created_at: new Date().toISOString(),
        sender_name: 'Test User',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useClientPhotos', () => ({
  default: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useClientDocuments', () => ({
  default: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard sections', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/próximos eventos/i)).toBeInTheDocument();
      expect(screen.getByText(/mensajes recientes/i)).toBeInTheDocument();
    });
  });

  it('should display upcoming events', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cita de prueba')).toBeInTheDocument();
    });
  });

  it('should display recent messages', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Mensaje de prueba')).toBeInTheDocument();
    });
  });

  it('should show loading skeletons while fetching data', () => {
    vi.mock('@/hooks/useClientUpcomingEvents', () => ({
      default: () => ({
        data: null,
        isLoading: true,
        error: null,
      }),
    }));

    render(<Dashboard />);

    // Skeletons should be visible
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/próximos eventos/i)).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
