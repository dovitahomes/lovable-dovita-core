import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';

expect.extend(toHaveNoViolations);

const mockUser = {
  id: 'u1',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    phone: '1234567890',
  },
};

vi.mock('@/hooks/useAuthSession', () => ({
  default: () => ({
    session: {
      user: mockUser,
    },
    loading: false,
  }),
}));

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings form', () => {
    render(<Settings />);

    expect(screen.getByText(/configuración/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should display user data', () => {
    render(<Settings />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    expect(nameInput).toHaveValue('Test User');

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('should update personal information', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const saveButton = screen.getByRole('button', { name: /guardar cambios/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/cambios guardados/i)).toBeInTheDocument();
    });
  });

  it('should toggle notification preferences', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    const emailSwitch = screen.getByRole('switch', { name: /notificaciones por email/i });
    await user.click(emailSwitch);

    expect(emailSwitch).toBeChecked();
  });

  it('should validate password change', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    const newPasswordInput = screen.getByLabelText(/nueva contraseña/i);
    await user.type(newPasswordInput, '123');

    const saveButton = screen.getByRole('button', { name: /cambiar contraseña/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/mínimo 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<Settings />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
