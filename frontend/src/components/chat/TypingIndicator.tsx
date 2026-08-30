interface Props {
  users: string[];
}

export function TypingIndicator({ users }: Props) {
  if (users.length === 0) return null;

  const text = users.length === 1
    ? `${users[0]} sedang mengetik`
    : users.length === 2
      ? `${users[0]} dan ${users[1]} sedang mengetik`
      : `${users[0]} dan ${users.length - 1} lainnya sedang mengetik`;

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-foreground-muted">
      <span className="flex gap-0.5">
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-foreground-muted [animation-delay:0ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-foreground-muted [animation-delay:150ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-foreground-muted [animation-delay:300ms]" />
      </span>
      <span>{text}</span>
    </div>
  );
}
