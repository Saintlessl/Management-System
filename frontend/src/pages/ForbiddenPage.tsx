import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md text-center">
        <ShieldX className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Akses ditolak</h1>
        <p className="mt-2 text-slate-600">Anda tidak memiliki permission untuk membuka halaman ini.</p>
        <Link to="/" className="mt-5 inline-block font-medium text-blue-600 hover:text-blue-700">Kembali ke beranda</Link>
      </div>
    </div>
  );
}
