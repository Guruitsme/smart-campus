'use client';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, GraduationCap, BookMarked, ClipboardList, Star, Bell, TrendingUp, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AdminDashboard() {
  const { data: dashData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.getDashboard(),
  });

  const dash = dashData?.data?.data;
  const deptStats = dash?.deptStats || [];

  const pieData = deptStats.map((d) => ({ name: d._id || 'Unknown', value: d.count }));
  const barData = deptStats.slice(0, 8).map((d) => ({ name: (d._id || 'Unknown').split(' ')[0], count: d.count }));

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Platform overview & management</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/students" className="btn-secondary text-xs"><UserPlus className="w-4 h-4" /> Add User</Link>
          <Link href="/dashboard/announcements" className="btn-primary text-xs"><Bell className="w-4 h-4" /> Announce</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Students', value: dash?.students, icon: <GraduationCap className="w-5 h-5" />, color: 'blue', href: '/dashboard/students' },
          { label: 'Total Faculty', value: dash?.faculty, icon: <Users className="w-5 h-5" />, color: 'violet', href: '/dashboard/faculty' },
          { label: 'Subjects', value: dash?.subjects, icon: <BookMarked className="w-5 h-5" />, color: 'teal', href: '/dashboard/subjects' },
          { label: 'Assignments', value: dash?.assignments, icon: <ClipboardList className="w-5 h-5" />, color: 'amber' },
          { label: 'Notes Uploaded', value: dash?.notes, icon: <BookMarked className="w-5 h-5" />, color: 'green' },
          { label: 'Feedback Entries', value: dash?.feedbacks, icon: <Star className="w-5 h-5" />, color: 'rose', href: '/dashboard/feedback' },
        ].map((s) => (
          <Link key={s.label} href={s.href || '#'} className={cn('stat-card group transition-shadow hover:shadow-card-hover', !s.href && 'cursor-default')}>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold font-display text-slate-900">
                {isLoading ? <span className="skeleton inline-block w-10 h-7 rounded" /> : (s.value ?? '—')}
              </p>
            </div>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', adminColorMap[s.color])}>
              {s.icon}
            </div>
          </Link>
        ))}
      </div>

      {/* New registrations badge */}
      {dash?.recentRegistrations > 0 && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-emerald-800 font-medium">
            <strong>{dash.recentRegistrations}</strong> new users registered in the last 7 days
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dept Bar Chart */}
        <div className="card">
          <h2 className="section-title mb-5">Students by Department</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h2 className="section-title mb-5">Department Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="section-title mb-4">Management</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/students', label: 'Manage Students', icon: '🎓', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { href: '/dashboard/faculty', label: 'Manage Faculty', icon: '👩‍🏫', color: 'bg-violet-50 text-violet-700 border-violet-200' },
            { href: '/dashboard/subjects', label: 'Manage Subjects', icon: '📚', color: 'bg-teal-50 text-teal-700 border-teal-200' },
            { href: '/dashboard/feedback', label: 'Feedback Analytics', icon: '⭐', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={cn('flex items-center gap-2.5 p-3.5 rounded-xl border font-medium text-sm transition-all hover:shadow-sm', a.color)}>
              <span className="text-xl">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const adminColorMap = {
  blue:   'bg-blue-100 text-blue-600',
  violet: 'bg-violet-100 text-violet-600',
  teal:   'bg-teal-100 text-teal-600',
  amber:  'bg-amber-100 text-amber-600',
  green:  'bg-emerald-100 text-emerald-600',
  rose:   'bg-rose-100 text-rose-600',
};
