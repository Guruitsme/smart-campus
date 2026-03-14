'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { GraduationCap, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import useAuthStore from '@/lib/store';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      const result = await login(data.email, data.password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin:   { email: 'admin@campus.edu',   password: 'Admin@1234' },
      faculty: { email: 'faculty@campus.edu', password: 'Faculty@123' },
      student: { email: 'student@campus.edu', password: 'Student@123' },
    };
    setValue('email', creds[role].email);
    setValue('password', creds[role].password);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 gradient-campus items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative text-white max-w-md">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">Smart Campus</h1>
          <p className="text-xl text-white/80 mb-8">Modern college management platform for students, faculty, and administrators.</p>
          <div className="space-y-4">
            {[
              { emoji: '🎓', text: 'Track attendance & academic performance' },
              { emoji: '📚', text: 'Access notes, assignments & schedules' },
              { emoji: '📊', text: 'Real-time analytics & notifications' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/90">
                <span className="text-xl">{emoji}</span>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-campus flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Smart Campus</h1>
          </div>

          <div className="card">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 mt-1.5">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 mb-5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('email', { required: 'Email is required' })}
                    type="email"
                    className={cn('input pl-10', errors.email && 'border-red-300 focus:ring-red-400')}
                    placeholder="you@campus.edu"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPass ? 'text' : 'password'}
                    className={cn('input pl-10 pr-10', errors.password && 'border-red-300 focus:ring-red-400')}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-3 text-center">Quick demo login</p>
              <div className="grid grid-cols-3 gap-2">
                {['admin', 'faculty', 'student'].map((role) => (
                  <button
                    key={role}
                    onClick={() => fillDemo(role)}
                    className={cn(
                      'py-2 px-3 rounded-xl text-xs font-semibold border transition-all capitalize',
                      role === 'admin' && 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
                      role === 'faculty' && 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100',
                      role === 'student' && 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            New to Smart Campus?{' '}
            <a href="/register" className="text-primary-600 font-medium hover:underline">Create account</a>
          </p>
        </div>
      </div>
    </div>
  );
}
