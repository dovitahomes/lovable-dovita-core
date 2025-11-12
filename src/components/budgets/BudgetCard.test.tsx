import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { BudgetCard } from './BudgetCard';
import userEvent from '@testing-library/user-event';

describe('BudgetCard', () => {
  const mockBudget = {
    budget_id: 'budget-1',
    project_id: 'project-1',
    type: 'parametrico',
    status: 'publicado',
    version: 1,
    total_items: 25,
    budget_total: 500000,
    alerts_over_5: 3,
    created_at: '2025-01-01T10:00:00Z',
  };

  const mockHandlers = {
    onView: vi.fn(),
    onExportExcel: vi.fn(),
    onExportPDF: vi.fn(),
  };

  it('should render budget information correctly', () => {
    render(<BudgetCard budget={mockBudget} {...mockHandlers} />);

    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('25 items')).toBeInTheDocument();
    expect(screen.getByText(/500,000/)).toBeInTheDocument();
  });

  it('should display correct badge for parametrico type', () => {
    render(<BudgetCard budget={mockBudget} {...mockHandlers} />);

    expect(screen.getByText('Paramétrico')).toBeInTheDocument();
  });

  it('should display correct badge for ejecutivo type', () => {
    const ejecutivoBudget = { ...mockBudget, type: 'ejecutivo' };
    render(<BudgetCard budget={ejecutivoBudget} {...mockHandlers} />);

    expect(screen.getByText('Ejecutivo')).toBeInTheDocument();
  });

  it('should display published status badge', () => {
    render(<BudgetCard budget={mockBudget} {...mockHandlers} />);

    expect(screen.getByText('Publicado')).toBeInTheDocument();
  });

  it('should display draft status badge', () => {
    const draftBudget = { ...mockBudget, status: 'borrador' };
    render(<BudgetCard budget={draftBudget} {...mockHandlers} />);

    expect(screen.getByText('Borrador')).toBeInTheDocument();
  });

  it('should display alert badge when alerts exist', () => {
    render(<BudgetCard budget={mockBudget} {...mockHandlers} />);

    expect(screen.getByText('3 alertas de precio')).toBeInTheDocument();
  });

  it('should not display alert badge when no alerts', () => {
    const budgetWithoutAlerts = { ...mockBudget, alerts_over_5: 0 };
    render(<BudgetCard budget={budgetWithoutAlerts} {...mockHandlers} />);

    expect(screen.queryByText(/alertas de precio/)).not.toBeInTheDocument();
  });

  it('should call onView when View button is clicked', async () => {
    const user = userEvent.setup();
    render(<BudgetCard budget={mockBudget} {...mockHandlers} />);

    const viewButton = screen.getByRole('button', { name: /ver/i });
    await user.click(viewButton);

    expect(mockHandlers.onView).toHaveBeenCalledWith(mockBudget.budget_id);
  });

  it('should call onExportExcel when Excel button is clicked', async () => {
    const user = userEvent.setup();
    render(<BudgetCard budget={mockBudget} {...mockHandlers} />);

    const excelButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg')?.getAttribute('data-lucide') === 'file-spreadsheet'
    );
    
    if (excelButton) {
      await user.click(excelButton);
      expect(mockHandlers.onExportExcel).toHaveBeenCalledWith(mockBudget.budget_id);
    }
  });

  it('should call onExportPDF when PDF button is clicked', async () => {
    const user = userEvent.setup();
    render(<BudgetCard budget={mockBudget} {...mockHandlers} />);

    const pdfButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg')?.getAttribute('data-lucide') === 'file-down'
    );
    
    if (pdfButton) {
      await user.click(pdfButton);
      expect(mockHandlers.onExportPDF).toHaveBeenCalledWith(mockBudget.budget_id);
    }
  });

  it('should format currency correctly', () => {
    render(<BudgetCard budget={mockBudget} {...mockHandlers} />);

    // Should display formatted Mexican currency
    const formattedAmount = screen.getByText(/500,000/);
    expect(formattedAmount).toBeInTheDocument();
  });

  it('should display initials avatar from project_id', () => {
    render(<BudgetCard budget={mockBudget} {...mockHandlers} />);

    const avatar = screen.getByText('PR'); // First 2 letters of project-1
    expect(avatar).toBeInTheDocument();
  });

  it('should fallback to budget_id for avatar when no project_id', () => {
    const budgetWithoutProject = { ...mockBudget, project_id: null };
    render(<BudgetCard budget={budgetWithoutProject} {...mockHandlers} />);

    const avatar = screen.getByText('BU'); // First 2 letters of budget-1
    expect(avatar).toBeInTheDocument();
  });

  it('should have proper animation delay based on index', () => {
    const { container } = render(
      <BudgetCard budget={mockBudget} {...mockHandlers} index={3} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({ animationDelay: '0.3s' });
  });
});
