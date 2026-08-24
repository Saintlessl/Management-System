import { ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function HomePage() {
  const { user, hasPermission } = useAuth();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-600">Selamat datang</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Halo, {user?.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Gunakan workspace ini untuk mengelola pengguna, role, dan permission aplikasi.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {hasPermission('users.view') && (
          <Link to="/admin/users" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="mt-3 font-semibold">Kelola pengguna</h2>
            <p className="mt-1 text-sm text-slate-500">Buat akun, atur status, dan tetapkan role.</p>
          </Link>
        )}
        {hasPermission('roles.view') && (
          <Link to="/admin/roles" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            <h2 className="mt-3 font-semibold">Kelola role</h2>
            <p className="mt-1 text-sm text-slate-500">Susun role dan permission akses.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
