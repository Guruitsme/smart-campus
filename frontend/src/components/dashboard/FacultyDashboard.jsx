'use client';
import { useQuery } from '@tanstack/react-query';
import { facultyAPI, attendanceAPI, assignmentAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Users, BookOpen, ClipboardList, CalendarDays, TrendingUp, Upload } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import useAuthStore from '@/lib/store';
import Link from 'next/link';

export default function FacultyDashboard() {
  const { user } = useAuthStore();

  const { data: dashData } = useQuery({
    queryKey: ['faculty-dashboard'],
    queryFn: () => facultyAPI.getDashboard(),
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['faculty-assignments'],
    queryFn: () => assignmentAPI.getAssignments(),
  });

  const dash = dashData?.data?.data;
  const assignments = assignmentsData?.data?.data || [];
  const subjects = dash?.subjects || [];
  const recentAttendance = dash?.recentAttendance || [];

  const attendanceChartData = recentAttendance.map((a) => ({
    date: formatDate(a.date, { day: '2-digit', month: 'short' }),
    present: a.presentCount,
    total: a.totalStudents,
    pct: a.totalStudents > 0 ? Math.round((a.presentCount / a.totalStudents) * 100) : 0,
  }));

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Faculty Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">{user?.department} · {user?.designation}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Subjects', value: subjects.length, icon: <BookOpen className="w-5 h-5" />, color: 'violet' },
          { label: 'Students', value: dash?.studentCount || 0, icon: <Users className="w-5 h-5" />, color: 'blue' },
          { label: 'Assignments', value: assignments.length, icon: <ClipboardList className="w-5 h-5" />, color: 'amber' },
          { label: 'Sessions Taken', value: recentAttendance.length, icon: <CalendarDays className="w-5 h-5" />, color: 'green' },
        ].map((s) => <FStatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance trend */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Recent Attendance Sessions</h2>
            <Link href="/dashboard/attendance" className="text-xs text-primary-600 font-medium hover:underline">Mark attendance →</Link>
          </div>
          {attendanceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No attendance sessions yet</div>
          )}
        </div>

        {/* Subjects list */}
        <div className="card">
          <h2 className="section-title mb-4">My Subjects</h2>
          <div className="space-y-2">
            {subjects.map((s) => (
              <div key={s._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.code} · Sem {s.semester}</p>
                </div>
                <span className="badge bg-primary-50 text-primary-700 border-primary-200">{s.credits}cr</span>
              </div>
            ))}
            {subjects.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No subjects assigned</p>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/attendance', label: 'Mark Attendance', icon: '✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { href: '/dashboard/notes', label: 'Upload Notes', icon: '📄', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { href: '/dashboard/assignments', label: 'New Assignment', icon: '📝', color: 'bg-violet-50 text-violet-700 border-violet-200' },
            { href: '/dashboard/marks', label: 'Upload Marks', icon: '📊', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={cn('flex items-center gap-2.5 p-3.5 rounded-xl border font-medium text-sm transition-all hover:shadow-sm', a.color)}>
              <span className="text-lg">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent assignments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Assignments</h2>
          <Link href="/dashboard/assignments" className="text-xs text-primary-600 font-medium hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              {['Title', 'Subject', 'Due Date', 'Submissions', 'Status'].map((h) => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {assignments.slice(0, 5).map((a) => (
                <tr key={a._id} className="hover:bg-slate-50/50">
                  <td className="table-cell font-medium">{a.title}</td>
                  <td className="table-cell text-slate-500">{a.subject?.code}</td>
                  <td className="table-cell">{formatDate(a.dueDate)}</td>
                  <td className="table-cell">{a.submissionCount || 0}</td>
                  <td className="table-cell">
                    <span className={cn('badge', new Date(a.dueDate) < new Date() ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}>
                      {new Date(a.dueDate) < new Date() ? 'Closed' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr><td colSpan={5} className="table-cell text-center text-slate-400 py-8">No assignments created yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FStatCard({ label, value, icon, color }) {
  const colorMap = {
    green:  'bg-emerald-50 text-emerald-600',
    blue:   'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber:  'bg-amber-50 text-amber-600',
  };
  return (
    <div className="stat-card">
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
        <p className="text-2xl font-bold font-display text-slate-900">{value}</p>
      </div>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
        {icon}
      </div>
    </div>
  );
}
