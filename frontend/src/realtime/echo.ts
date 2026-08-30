import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echoInstance: any = null;

export function getEcho(): any {
  if (echoInstance) return echoInstance;

  const host = import.meta.env.VITE_REVERB_HOST as string | undefined;
  const port = Number(import.meta.env.VITE_REVERB_PORT ?? 6001);
  const scheme = (import.meta.env.VITE_REVERB_SCHEME ?? 'ws') as 'ws' | 'wss';

  if (!host) return null;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (window as unknown as Record<string, unknown>).Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY ?? '',
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'wss',
    enabledTransports: ['ws', 'wss'],
  });

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
