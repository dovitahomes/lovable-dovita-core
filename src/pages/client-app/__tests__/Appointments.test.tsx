import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import Appointments from '../Appointments';

expect.extend(toHaveNoViolations);

const mockAppointments = [
  {
    id: '1',
    title: 'Cita de prueba',
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    type: 'site_visit',
    status: 'pending',
    location: 'Test Location',
  },
];

vi.mock('@/contexts/client-app/ProjectContext', () => ({
  useProject: () => ({
    currentProject: {
      id: '1',
      name: 'Test Project',
    },
  }),
}));

vi.mock('@/hooks/useProjectAppointments', () => ({
  default: () => ({
    data: mockAppointments,
    isLoading: false,
    error: null,
    confirmAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
  }),
}));

describe('Appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render appointments calendar', async () => {
    render(<Appointments />);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  it('should display appointments', async () => {
    render(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText('Cita de prueba')).toBeInTheDocument();
    });
  });

  it('should open appointment modal on click', async () => {
    const user = userEvent.setup();
    render(<Appointments />);

    await waitFor(() => {
      const appointment = screen.getByText('Cita de prueba');
      user.click(appointment);
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should show empty state when no appointments', async () => {
    vi.mock('@/hooks/useProjectAppointments', () => ({
      default: () => ({
        data: [],
        isLoading: false,
        error: null,
        confirmAppointment: vi.fn(),
        cancelAppointment: vi.fn(),
      }),
    }));

    render(<Appointments />);

    await waitFor(() => {
      expect(screen.getByText(/no hay citas programadas/i)).toBeInTheDocument();
    });
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<Appointments />);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
