import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

function StatefulModalForm() {
  const [value, setValue] = useState('');

  return (
    <Modal isOpen onClose={() => undefined} title="Tim baru">
      <label htmlFor="team-name">Nama tim</label>
      <input id="team-name" value={value} onChange={(event) => setValue(event.target.value)} />
    </Modal>
  );
}

describe('Modal', () => {
  it('keeps focus in a controlled input while each character updates its parent', async () => {
    const user = userEvent.setup();
    render(<StatefulModalForm />);
    const input = screen.getByRole('textbox', { name: 'Nama tim' });

    await user.click(input);
    await user.type(input, 'Tim123');

    expect(input).toHaveValue('Tim123');
    expect(input).toHaveFocus();
  });

  it('exposes accessible dialog semantics and closes from its button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<Modal isOpen onClose={onClose} title="Edit pengguna"><p>Content</p></Modal>);

    expect(screen.getByRole('dialog', { name: 'Edit pengguna' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tutup dialog' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
