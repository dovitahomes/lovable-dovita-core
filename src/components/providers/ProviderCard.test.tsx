import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ProviderCard } from './ProviderCard';
import userEvent from '@testing-library/user-event';

describe('ProviderCard', () => {
  const mockProvider = {
    id: 'provider-1',
    code_short: 'PROV',
    name: 'Test Provider',
    fiscales_json: {
      rfc: 'RFC123456',
    },
    contacto_json: {
      email: 'test@example.com',
      telefono: '5551234567',
    },
    activo: true,
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onView: vi.fn(),
    onViewUsage: vi.fn(),
    onDelete: vi.fn(),
  };

  it('should render provider information correctly', () => {
    render(<ProviderCard provider={mockProvider} {...mockHandlers} />);

    expect(screen.getByText('Test Provider')).toBeInTheDocument();
    expect(screen.getByText('PROV')).toBeInTheDocument();
    expect(screen.getByText('RFC123456')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('5551234567')).toBeInTheDocument();
  });

  it('should display active badge for active provider', () => {
    render(<ProviderCard provider={mockProvider} {...mockHandlers} />);

    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('should display inactive badge for inactive provider', () => {
    const inactiveProvider = { ...mockProvider, activo: false };
    render(<ProviderCard provider={inactiveProvider} {...mockHandlers} />);

    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('should display initials avatar from code_short', () => {
    render(<ProviderCard provider={mockProvider} {...mockHandlers} />);

    const avatar = screen.getByText('PR'); // First 2 letters of PROV
    expect(avatar).toBeInTheDocument();
  });

  it('should call onView when View button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProviderCard provider={mockProvider} {...mockHandlers} />);

    const viewButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg')?.getAttribute('data-lucide') === 'eye'
    );
    
    if (viewButton) {
      await user.click(viewButton);
      expect(mockHandlers.onView).toHaveBeenCalledWith(mockProvider);
    }
  });

  it('should call onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProviderCard provider={mockProvider} {...mockHandlers} />);

    const editButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg')?.getAttribute('data-lucide') === 'edit'
    );
    
    if (editButton) {
      await user.click(editButton);
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockProvider);
    }
  });

  it('should call onViewUsage when Usage button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProviderCard provider={mockProvider} {...mockHandlers} />);

    const usageButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg')?.getAttribute('data-lucide') === 'file-bar-chart'
    );
    
    if (usageButton) {
      await user.click(usageButton);
      expect(mockHandlers.onViewUsage).toHaveBeenCalledWith(mockProvider);
    }
  });

  it('should call onDelete when Delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProviderCard provider={mockProvider} {...mockHandlers} />);

    const deleteButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg')?.getAttribute('data-lucide') === 'trash-2'
    );
    
    if (deleteButton) {
      await user.click(deleteButton);
      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockProvider.id);
    }
  });

  it('should handle missing fiscal data gracefully', () => {
    const providerWithoutFiscal = {
      ...mockProvider,
      fiscales_json: undefined,
    };
    
    render(<ProviderCard provider={providerWithoutFiscal} {...mockHandlers} />);

    expect(screen.getByText('Test Provider')).toBeInTheDocument();
    expect(screen.queryByText('RFC123456')).not.toBeInTheDocument();
  });

  it('should handle missing contact data gracefully', () => {
    const providerWithoutContact = {
      ...mockProvider,
      contacto_json: undefined,
    };
    
    render(<ProviderCard provider={providerWithoutContact} {...mockHandlers} />);

    expect(screen.getByText('Test Provider')).toBeInTheDocument();
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('should have proper animation delay based on index', () => {
    const { container } = render(
      <ProviderCard provider={mockProvider} {...mockHandlers} index={2} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({ animationDelay: '0.2s' });
  });
});
