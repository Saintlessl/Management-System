import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('toggles password visibility without changing its value', async () => {
    const user = userEvent.setup();
    render(<Input id="password" label="Password" type="password" />);

    const input = screen.getByLabelText('Password');
    await user.type(input, 'Admin12345');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Tampilkan password' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('Admin12345');
    expect(screen.getByRole('button', { name: 'Sembunyikan password' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Sembunyikan password' }));
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveValue('Admin12345');
  });

  it('does not add a visibility button to non-password fields', () => {
    render(<Input id="email" label="Email" type="email" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
