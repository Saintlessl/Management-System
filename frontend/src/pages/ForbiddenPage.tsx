import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-input p-4">
      <div className="max-w-md text-center">
        <ShieldX className="mx-auto h-12 w-12 text-danger" />
        <h1 className="mt-4 text-2xl font-bold">Akses ditolak</h1>
        <p className="mt-2 text-foreground-muted">Anda tidak memiliki permission untuk membuka halaman ini.</p>
        <Link to="/" className="mt-5 inline-block font-medium text-primary hover:text-primary">Kembali ke beranda</Link>
      </div>
    </div>
  );
}
