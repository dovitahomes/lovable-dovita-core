import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import Financial from '../Financial';

expect.extend(toHaveNoViolations);

const mockFinancialData = [
  {
    project_id: '1',
    client_id: 'c1',
    client_name: 'Test Client',
    total_deposits: 100000,
    total_expenses: 50000,
    balance: 50000,
    mayor_id: 'm1',
    mayor_code: '1.1',
    mayor_name: 'Construcción',
    mayor_expense: 50000,
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

vi.mock('@/features/client/hooks', () => ({
  useClientFinancialSummary: () => ({
    data: mockFinancialData,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('Financial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render financial summary', async () => {
    render(<Financial />);

    await waitFor(() => {
      expect(screen.getByText(/resumen financiero/i)).toBeInTheDocument();
    });
  });

  it('should display financial data', async () => {
    render(<Financial />);

    await waitFor(() => {
      expect(screen.getByText(/construcción/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no data', async () => {
    vi.mock('@/features/client/hooks', () => ({
      useClientFinancialSummary: () => ({
        data: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
      }),
    }));

    render(<Financial />);

    await waitFor(() => {
      expect(screen.getByText(/no hay información financiera/i)).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.mock('@/features/client/hooks', () => ({
      useClientFinancialSummary: () => ({
        data: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      }),
    }));

    render(<Financial />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<Financial />);
    
    await waitFor(() => {
      expect(screen.getByText(/resumen financiero/i)).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
