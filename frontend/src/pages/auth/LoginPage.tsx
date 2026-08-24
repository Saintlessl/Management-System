import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { LockKeyhole } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Masukkan alamat email yang valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values.email, values.password);
      const stateFrom = (location.state as { from?: string } | null)?.from;
      navigate(stateFrom ?? searchParams.get('from') ?? '/', { replace: true });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.status === 502 || !error.response
          ? 'Backend Laravel tidak tersambung. Jalankan server backend pada 127.0.0.1:8000.'
          : error.response?.data?.errors?.email?.[0] ?? error.response?.data?.message
        : null;
      setError('root', { message: message ?? 'Login gagal. Silakan coba lagi.' });
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-lg font-bold">Management System</p>
        <div>
          <h1 className="max-w-lg text-4xl font-bold leading-tight">Kelola tim dan akses aplikasi dari satu workspace.</h1>
          <p className="mt-4 max-w-lg text-blue-100">Akun hanya dibuat oleh administrator agar akses organisasi tetap terkontrol.</p>
        </div>
        <p className="text-sm text-blue-200">Secure administration workspace</p>
      </section>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">Masuk ke akun Anda</h2>
          <p className="mt-2 text-sm text-slate-500">Gunakan akun yang diberikan oleh administrator.</p>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              id="email"
              type="email"
              label="Email"
              autoComplete="email"
              placeholder="nama@perusahaan.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              placeholder="Masukkan password"
              error={errors.password?.message}
              {...register('password')}
            />
            {errors.root?.message && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {errors.root.message}
              </div>
            )}
            <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
              Masuk
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
