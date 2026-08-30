import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  LockKeyhole,
  Mail,
  UsersRound,
  Workflow,
} from 'lucide-react';
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

const workspaceFeatures = [
  {
    title: 'Proyek & tugas',
    description: 'Pantau progres dan prioritas dalam satu ruang kerja.',
    icon: FolderKanban,
  },
  {
    title: 'Alur persetujuan',
    description: 'Jaga keputusan dan revisi tetap tercatat dengan jelas.',
    icon: Workflow,
  },
  {
    title: 'Kolaborasi tim',
    description: 'Satukan konteks kerja, percakapan, dan tanggung jawab.',
    icon: UsersRound,
  },
];

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
    <main className="grid min-h-[100dvh] overflow-hidden bg-background lg:grid-cols-[minmax(32rem,1.08fr)_minmax(30rem,0.92fr)]">
      <section
        data-testid="login-brand-panel"
        className="login-brand-panel relative hidden overflow-hidden text-white lg:flex lg:min-h-[100dvh] lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16 xl:py-12"
      >
        <div className="relative z-10 flex items-center gap-3">
          <span className="brand-mark flex h-10 w-10 items-center justify-center rounded-xl text-base font-semibold text-white shadow-lg shadow-indigo-950/20">
            P
          </span>
          <span>
            <span className="block text-[15px] font-semibold tracking-tight">ProManage</span>
            <span className="block text-[11px] text-indigo-100/65">Project workspace</span>
          </span>
        </div>

        <div className="relative z-10 max-w-xl py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-xs font-medium text-indigo-50 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.85)]" />
            Workspace internal
          </div>
          <h1 className="mt-6 max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-white xl:text-5xl">
            Kerja tim lebih jernih, dari rencana sampai selesai.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-indigo-100/70">
            Kelola prioritas, progres, dan keputusan penting dalam satu sistem yang dibangun untuk menjaga setiap tim tetap selaras.
          </p>

          <div className="mt-9 grid max-w-lg gap-3">
            {workspaceFeatures.map(({ title, description, icon: Icon }) => (
              <div key={title} className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 backdrop-blur-sm transition-colors hover:bg-white/8">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-cyan-200">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-indigo-100/60">{description}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-indigo-100/55">
          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
          Akses aman untuk pengguna workspace terdaftar.
        </div>
      </section>

      <section className="login-form-panel relative flex min-h-[100dvh] items-center justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
        <div className="relative z-10 w-full max-w-[29rem]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="brand-mark flex h-10 w-10 items-center justify-center rounded-xl text-base font-semibold text-white shadow-md">
              P
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-tight text-foreground">ProManage</span>
              <span className="block text-[11px] text-foreground-muted">Project workspace</span>
            </span>
          </div>

          <div className="rounded-2xl border border-white/80 bg-surface/95 p-6 shadow-[0_24px_80px_-32px_rgba(43,49,91,0.32)] backdrop-blur sm:p-8">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary ring-1 ring-primary/10">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">Masuk ke ProManage</h2>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  Lanjutkan ke workspace menggunakan akun terdaftar.
                </p>
              </div>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input
                id="email"
                type="email"
                label="Email"
                autoComplete="email"
                placeholder="nama@perusahaan.com"
                icon={<Mail className="h-4 w-4" />}
                className="h-12 pl-10 text-base sm:text-sm"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                id="password"
                type="password"
                label="Password"
                autoComplete="current-password"
                placeholder="Masukkan password"
                icon={<LockKeyhole className="h-4 w-4" />}
                className="h-12 pl-10 text-base sm:text-sm"
                error={errors.password?.message}
                {...register('password')}
              />

              {errors.root?.message && (
                <div
                  className="rounded-xl border border-danger/20 bg-danger/8 px-3.5 py-3 text-[13px] leading-relaxed text-danger"
                  role="alert"
                >
                  {errors.root.message}
                </div>
              )}

              <Button type="submit" size="lg" isLoading={isSubmitting} className="h-12 w-full rounded-xl shadow-lg shadow-primary/18">
                Masuk
                {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 border-t border-border/80 pt-5 text-center text-xs text-foreground-muted">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Butuh akses? Hubungi administrator workspace.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
