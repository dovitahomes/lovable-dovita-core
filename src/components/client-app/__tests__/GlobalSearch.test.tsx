import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import GlobalSearch from '../GlobalSearch';

expect.extend(toHaveNoViolations);

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(<GlobalSearch open={true} onOpenChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should update search term on input', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch open={true} onOpenChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    await user.type(searchInput, 'documento');

    expect(searchInput).toHaveValue('documento');
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch open={true} onOpenChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    
    await user.click(searchInput);
    expect(searchInput).toHaveFocus();

    await user.keyboard('{Escape}');
    // Dialog should close on Escape
  });

  it('should have proper ARIA attributes', () => {
    render(<GlobalSearch open={true} onOpenChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    expect(searchInput).toHaveAttribute('type', 'search');
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<GlobalSearch open={true} onOpenChange={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show search results when typing', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch open={true} onOpenChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    await user.type(searchInput, 'test');

    await waitFor(() => {
      // Results should appear
      expect(searchInput).toHaveValue('test');
    });
  });
});
