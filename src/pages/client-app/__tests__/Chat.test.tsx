import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import Chat from '../Chat';

expect.extend(toHaveNoViolations);

const mockMessages = [
  {
    id: '1',
    content: 'Hola',
    created_at: new Date().toISOString(),
    sender_id: 'u1',
    sender_name: 'Test User',
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
  useProjectChat: () => ({
    messages: mockMessages,
    isLoading: false,
    error: null,
    sendMessage: vi.fn(),
  }),
}));

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chat interface', async () => {
    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('should display messages', async () => {
    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByText('Hola')).toBeInTheDocument();
    });
  });

  it('should have message input', () => {
    render(<Chat />);

    const input = screen.getByPlaceholderText(/escribe un mensaje/i);
    expect(input).toBeInTheDocument();
  });

  it('should send message on submit', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();

    vi.mock('@/features/client/hooks', () => ({
      useProjectChat: () => ({
        messages: mockMessages,
        isLoading: false,
        error: null,
        sendMessage,
      }),
    }));

    render(<Chat />);

    const input = screen.getByPlaceholderText(/escribe un mensaje/i);
    await user.type(input, 'Nuevo mensaje');

    const sendButton = screen.getByRole('button', { name: /enviar/i });
    await user.click(sendButton);

    expect(sendMessage).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    vi.mock('@/features/client/hooks', () => ({
      useProjectChat: () => ({
        messages: [],
        isLoading: true,
        error: null,
        sendMessage: vi.fn(),
      }),
    }));

    render(<Chat />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<Chat />);
    
    await waitFor(() => {
      expect(screen.getByText('Hola')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
