import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import Photos from '../Photos';

expect.extend(toHaveNoViolations);

const mockPhotos = [
  {
    id: '1',
    title: 'Foto de prueba',
    storage_path: 'test.jpg',
    created_at: new Date().toISOString(),
    public_url: 'https://example.com/test.jpg',
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

vi.mock('@/hooks/useClientPhotos', () => ({
  default: () => ({
    data: mockPhotos,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('Photos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render photos grid', async () => {
    render(<Photos />);

    await waitFor(() => {
      expect(screen.getByText('Foto de prueba')).toBeInTheDocument();
    });
  });

  it('should show empty state when no photos', async () => {
    vi.mock('@/hooks/useClientPhotos', () => ({
      default: () => ({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      }),
    }));

    render(<Photos />);

    await waitFor(() => {
      expect(screen.getByText(/no hay fotos disponibles/i)).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.mock('@/hooks/useClientPhotos', () => ({
      default: () => ({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      }),
    }));

    render(<Photos />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(<Photos />);
    
    await waitFor(() => {
      expect(screen.getByText('Foto de prueba')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
