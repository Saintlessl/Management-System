import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamChatBubble } from './TeamChatBubble';

const state = vi.hoisted(() => ({
  permissions: new Set(['chat.view', 'chat.create', 'chat.send']),
  conversations: [] as Array<Record<string, unknown>>,
  users: [] as Array<Record<string, unknown>>,
  createPrivate: vi.fn(),
  sendMessage: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 4, name: 'Manager Demo', email: 'manager@example.com', avatar: null },
    hasPermission: (permission: string) => state.permissions.has(permission),
  }),
}));

vi.mock('@/hooks/useChat', () => ({
  useConversations: () => ({ data: { data: state.conversations }, isLoading: false }),
  useMessages: () => ({ data: { pages: [{ data: [] }] }, isLoading: false }),
  useChatMutations: () => ({
    createPrivate: { mutateAsync: state.createPrivate, isPending: false },
    sendMessage: { mutateAsync: state.sendMessage, isPending: false },
  }),
  useChatSearch: (query: string) => ({
    data: { data: { users: query.length >= 2 ? state.users : [], conversations: [] } },
    isFetching: false,
  }),
}));

vi.mock('@/hooks/useRealtime', () => ({
  useRealtime: () => ({ typingUsers: [], sendTyping: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock('react-hot-toast', () => ({ default: { error: state.toastError } }));

describe('TeamChatBubble', () => {
  beforeEach(() => {
    state.permissions = new Set(['chat.view', 'chat.create', 'chat.send']);
    state.conversations = [];
    state.users = [
      { id: 5, name: 'Member Demo', email: 'member@example.com', avatar: null },
    ];
    state.createPrivate.mockReset().mockResolvedValue({
      data: {
        id: 42,
        type: 'private',
        name: null,
        unread_count: 0,
        participants: [],
      },
    });
    state.sendMessage.mockReset();
    state.toastError.mockReset();
  });

  it('creates a private conversation from the empty state and opens its message input', async () => {
    const user = userEvent.setup();
    renderBubble();

    await user.click(screen.getByRole('button', { name: 'Buka team chat' }));
    await user.click(screen.getByText('Mulai chat baru'));

    expect(screen.getByRole('dialog', { name: 'Percakapan baru' })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Cari pengguna' }), 'member');
    await user.click(screen.getByRole('button', { name: /Member Demo/ }));

    expect(state.createPrivate).toHaveBeenCalledWith(5);
    expect(screen.queryByRole('dialog', { name: 'Percakapan baru' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ketik pesan...')).toBeInTheDocument();
  });

  it('lists private conversations by the other participant and reopens them', async () => {
    state.conversations = [
      {
        id: 42,
        type: 'private',
        name: null,
        unread_count: 0,
        participants: [
          { id: 4, name: 'Manager Demo', email: 'manager@example.com', avatar: null },
          { id: 5, name: 'Member Demo', email: 'member@example.com', avatar: null },
        ],
      },
    ];
    const user = userEvent.setup();
    renderBubble();

    await user.click(screen.getByRole('button', { name: 'Buka team chat' }));
    await user.click(screen.getByRole('button', { name: /Member Demo/ }));

    expect(screen.getByPlaceholderText('Ketik pesan...')).toBeInTheDocument();
  });
});

function renderBubble() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TeamChatBubble />
    </QueryClientProvider>,
  );
}
