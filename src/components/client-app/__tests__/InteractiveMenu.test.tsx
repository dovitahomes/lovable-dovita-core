import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { InteractiveMenu } from '../InteractiveMenu';
import { Home, Calendar, FileText } from 'lucide-react';

expect.extend(toHaveNoViolations);

const mockItems = [
  { label: 'Inicio', icon: Home },
  { label: 'Calendario', icon: Calendar },
  { label: 'Documentos', icon: FileText },
];

describe('InteractiveMenu', () => {
  it('should render all menu items', () => {
    render(<InteractiveMenu items={mockItems} />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Calendario')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
  });

  it('should highlight active item', () => {
    render(<InteractiveMenu items={mockItems} activeIndex={1} />);

    const calendarButton = screen.getByRole('button', { name: /calendario/i });
    expect(calendarButton).toHaveClass('active');
    expect(calendarButton).toHaveAttribute('aria-current', 'page');
  });

  it('should call onItemClick when item is clicked', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();

    render(<InteractiveMenu items={mockItems} onItemClick={onItemClick} />);

    const documentosButton = screen.getByRole('button', { name: /documentos/i });
    await user.click(documentosButton);

    expect(onItemClick).toHaveBeenCalledWith(2);
  });

  it('should support keyboard navigation with Enter', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();

    render(<InteractiveMenu items={mockItems} onItemClick={onItemClick} />);

    const inicioButton = screen.getByRole('button', { name: /inicio/i });
    inicioButton.focus();

    await user.keyboard('{Enter}');
    expect(onItemClick).toHaveBeenCalledWith(0);
  });

  it('should support keyboard navigation with Space', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();

    render(<InteractiveMenu items={mockItems} onItemClick={onItemClick} />);

    const calendarButton = screen.getByRole('button', { name: /calendario/i });
    calendarButton.focus();

    await user.keyboard(' ');
    expect(onItemClick).toHaveBeenCalledWith(1);
  });

  it('should have proper ARIA labels', () => {
    render(<InteractiveMenu items={mockItems} activeIndex={0} />);

    const nav = screen.getByRole('navigation', { name: /navegación principal del cliente/i });
    expect(nav).toBeInTheDocument();

    const inicioButton = screen.getByRole('button', { name: /inicio \(página actual\)/i });
    expect(inicioButton).toBeInTheDocument();
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<InteractiveMenu items={mockItems} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle invalid items gracefully', () => {
    render(<InteractiveMenu items={[]} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toBeEmptyDOMElement();
  });
});
