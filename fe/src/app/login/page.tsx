'use client';

import { FormEvent, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { authStorage } from '@/lib/auth';
// Removed standard Card imports for custom 3D design
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      const result = await authApi.login({ email, password });
      authStorage.setToken(result.token);
      toast.success('Login berhasil');
      router.replace(searchParams.get('next') || '/');
    } catch {
      toast.error('Email atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Dynamic 3D Background Elements */}
      <div className="absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-violet-600/30 blur-[120px] mix-blend-screen animate-in fade-in duration-1000" />
      <div className="absolute top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[150px] mix-blend-screen animate-in fade-in slide-in-from-right-12 duration-1000 delay-300" />
      <div className="absolute -bottom-[20%] left-[20%] h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500" />

      {/* Decorative Floating Shapes */}
      <div className="absolute top-1/4 left-1/4 h-24 w-24 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-[spin_10s_linear_infinite]" />
      <div className="absolute bottom-1/4 right-1/4 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 backdrop-blur-3xl border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-[ping_5s_cubic-bezier(0,0,0.2,1)_infinite]" />

      {/* Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 fade-in duration-700">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.8),0_25px_50px_-12px_rgba(79,70,229,0.3)] backdrop-blur-2xl transition-all hover:shadow-[0_0_60px_-12px_rgba(0,0,0,0.8),0_30px_60px_-12px_rgba(79,70,229,0.4)] hover:-translate-y-1">
          
          {/* Shine effect across the card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="mb-8 text-center">
            <h1 className="bg-gradient-to-br from-white to-white/50 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-sm">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Masuk ke akun TaskPulse milikmu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 group">
              <Label htmlFor="email" className="text-slate-300 group-focus-within:text-violet-400 transition-colors">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus-visible:ring-violet-500 focus-visible:border-violet-500 focus-visible:bg-white/10 transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group pb-2">
              <Label htmlFor="password" className="text-slate-300 group-focus-within:text-violet-400 transition-colors">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus-visible:ring-violet-500 focus-visible:border-violet-500 focus-visible:bg-white/10 transition-all shadow-inner"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="group relative w-full h-12 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-lg hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? 'Loading...' : 'Login'}
              </span>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Belum punya akun?{' '}
            <Link
              href="/register"
              className="font-semibold text-violet-400 hover:text-violet-300 transition-colors hover:underline underline-offset-4"
            >
              Register sekarang
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
