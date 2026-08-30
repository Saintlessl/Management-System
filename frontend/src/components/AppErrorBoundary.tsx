import { type ErrorInfo, type ReactNode, Component } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

function isChunkLoadError(error: Error) {
  return /chunkloaderror|loading chunk|failed to fetch dynamically imported module|importing a module script failed/i.test(
    error.message,
  );
}

/*
  A lazy route rejection or an uncaught render error otherwise unmounts the
  entire React tree. Keep a themed recovery surface mounted instead, and leave
  the original error in DevTools so failures remain diagnosable.
*/
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application render failed.', error, errorInfo.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    const chunkLoadFailed = isChunkLoadError(error);

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-7 w-7 text-danger" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-semibold tracking-tight">
            {chunkLoadFailed ? 'Versi aplikasi perlu dimuat ulang' : 'Halaman tidak dapat ditampilkan'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            {chunkLoadFailed
              ? 'Ada pembaruan aplikasi atau koneksi terputus saat halaman dimuat. Muat ulang untuk melanjutkan.'
              : 'Terjadi gangguan saat menampilkan halaman. Coba lagi, atau muat ulang aplikasi jika masalah berlanjut.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {!chunkLoadFailed && (
              <Button variant="outline" onClick={this.retry}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Coba lagi
              </Button>
            )}
            <Button onClick={this.reload}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Muat ulang aplikasi
            </Button>
          </div>
        </section>
      </main>
    );
  }
}
