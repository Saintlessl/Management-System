import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

function ThrowError({ error }: { error: Error | null }) {
  if (error) throw error;
  return <div>Halaman berhasil dimuat</div>;
}

describe('AppErrorBoundary', () => {
  it('renders a recovery screen instead of unmounting after a render failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <ThrowError error={new Error('Render failed')} />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Halaman tidak dapat ditampilkan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });

  it('resets the boundary when retry is selected', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const { rerender } = render(
      <AppErrorBoundary>
        <ThrowError error={new Error('Render failed')} />
      </AppErrorBoundary>,
    );

    rerender(
      <AppErrorBoundary>
        <ThrowError error={null} />
      </AppErrorBoundary>,
    );
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(screen.getByText('Halaman berhasil dimuat')).toBeInTheDocument();
  });

  it('asks users to reload when a lazy route chunk cannot be loaded', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <ThrowError error={new Error('Failed to fetch dynamically imported module')} />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Versi aplikasi perlu dimuat ulang' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Muat ulang aplikasi' })).toBeInTheDocument();
  });
});
