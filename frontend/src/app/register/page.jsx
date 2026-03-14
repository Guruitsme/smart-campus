'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { cn, DEPARTMENTS, SEMESTERS } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'student' }
  });

  const role = watch('role');

  const onSubmit = async (data) => {
    setError('');
    setIsLoading(true);
    try {
      await authAPI.register(data);
      await login(data.email, data.password);
      toast.success('Account created successfully!');
      router.replace('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-campus flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Smart Campus</h1>
        </div>

        <div className="card">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900">Create Account</h2>
            <p className="text-slate-500 mt-1">Join the Smart Campus platform</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {['student', 'faculty', 'admin'].map((r) => (
                  <label key={r} className={cn(
                    'flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all capitalize text-sm font-semibold',
                    watch('role') === r
                      ? r === 'student' ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : r === 'faculty' ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  )}>
                    <input type="radio" value={r} {...register('role')} className="sr-only" />
                    {r === 'student' ? '🎓' : r === 'faculty' ? '👩‍🏫' : '⚙️'} {r}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Full Name *</label>
                <input {...register('name', { required: 'Name is required' })} className={cn('input', errors.name && 'border-red-300')} placeholder="John Doe" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" {...register('email', { required: 'Email is required' })} className={cn('input', errors.email && 'border-red-300')} placeholder="you@campus.edu" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                  className={cn('input pr-10', errors.password && 'border-red-300')}
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Department</label>
              <select {...register('department')} className="input">
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Roll Number</label>
                  <input {...register('rollNumber')} className="input" placeholder="CS2021001" />
                </div>
                <div>
                  <label className="label">Semester</label>
                  <select {...register('semester', { valueAsNumber: true })} className="input">
                    {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
            )}

            {role === 'faculty' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Employee ID</label>
                  <input {...register('employeeId')} className="input" placeholder="FAC001" />
                </div>
                <div>
                  <label className="label">Designation</label>
                  <input {...register('designation')} className="input" placeholder="Asst. Professor" />
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3 mt-2">
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Already have an account?{' '}
          <a href="/login" className="text-primary-600 font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
