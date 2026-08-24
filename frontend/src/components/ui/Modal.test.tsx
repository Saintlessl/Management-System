import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('exposes accessible dialog semantics and closes from its button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<Modal isOpen onClose={onClose} title="Edit pengguna"><p>Content</p></Modal>);

    expect(screen.getByRole('dialog', { name: 'Edit pengguna' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tutup dialog' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
