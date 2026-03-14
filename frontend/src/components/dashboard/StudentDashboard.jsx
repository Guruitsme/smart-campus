'use client';
import { useQuery } from '@tanstack/react-query';
import { studentAPI, attendanceAPI, assignmentAPI, announcementAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, BookOpen, ClipboardList, BarChart3, Bell, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn, getAttendanceBg, formatDate, getCategoryIcon } from '@/lib/utils';
import useAuthStore from '@/lib/store';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: dashData } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => studentAPI.getDashboard(),
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => attendanceAPI.getMyAttendance(),
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentAPI.getAssignments(),
  });

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementAPI.getAnnouncements({ limit: 5 }),
  });

  const dash = dashData?.data?.data;
  const attendance = attendanceData?.data?.data || [];
  const assignments = assignmentsData?.data?.data || [];
  const announcements = announcementsData?.data?.data || [];

  const overallAttendance = dash?.overallAttendance || 0;
  const pendingCount = assignments.filter((a) => a.isOverdue === false && !a.submission).length;
  const overdueCount = assignments.filter((a) => a.isOverdue).length;

  // Attendance chart data
  const attendanceChartData = attendance.slice(0, 6).map((a) => ({
    name: a.subject?.code || 'Sub',
    percentage: a.percentage,
    present: a.present,
    total: a.total,
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="page-title">My Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {user?.department} · Semester {user?.semester} · {user?.rollNumber}
        </p>
      </div>

      {/* Low attendance alert */}
      {overallAttendance < 75 && overallAttendance > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">⚠️ Low Attendance Warning</p>
            <p className="text-xs text-red-600 mt-0.5">
              Your overall attendance is <strong>{overallAttendance}%</strong>. Minimum required is 75%. Please attend classes regularly.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Overall Attendance"
          value={`${overallAttendance}%`}
          icon={<CalendarDays className="w-5 h-5" />}
          color={overallAttendance >= 75 ? 'green' : 'red'}
          sub={`${dash?.totalClasses || 0} total classes`}
        />
        <StatCard
          label="Pending Assignments"
          value={pendingCount}
          icon={<ClipboardList className="w-5 h-5" />}
          color="blue"
          sub={overdueCount > 0 ? `${overdueCount} overdue` : 'All on track'}
        />
        <StatCard
          label="Subjects"
          value={attendance.length}
          icon={<BookOpen className="w-5 h-5" />}
          color="violet"
          sub={`Semester ${user?.semester}`}
        />
        <StatCard
          label="Notifications"
          value={dash?.unreadNotifications || 0}
          icon={<Bell className="w-5 h-5" />}
          color="amber"
          sub="Unread"
        />
      </div>

      {/* Charts + Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Bar Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Subject-wise Attendance</h2>
            <Link href="/dashboard/attendance" className="text-xs text-primary-600 font-medium hover:underline">View all →</Link>
          </div>
          {attendanceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceChartData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Attendance']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {attendanceChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.percentage >= 75 ? '#6366f1' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No attendance data yet</div>
          )}
        </div>

        {/* Subject Attendance Summary */}
        <div className="card">
          <h2 className="section-title mb-4">Attendance Summary</h2>
          <div className="space-y-3">
            {attendance.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No attendance records</p>
            )}
            {attendance.slice(0, 5).map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 truncate flex-1">{s.subject?.code}</span>
                  <span className={cn('text-xs font-bold ml-2', s.percentage >= 85 ? 'text-emerald-600' : s.percentage >= 75 ? 'text-amber-500' : 'text-red-500')}>
                    {s.percentage}%
                  </span>
                </div>
                <div className="attendance-bar">
                  <div
                    className={cn('attendance-fill', s.percentage >= 85 ? 'bg-emerald-500' : s.percentage >= 75 ? 'bg-amber-400' : 'bg-red-500')}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Upcoming Assignments</h2>
            <Link href="/dashboard/assignments" className="text-xs text-primary-600 font-medium hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {assignments.filter((a) => !a.submission && !a.isOverdue).slice(0, 4).map((a) => (
              <div key={a._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.subject?.name} · Due {formatDate(a.dueDate)}</p>
                </div>
                <span className="badge bg-amber-50 text-amber-700 border-amber-200 ml-2 shrink-0">Pending</span>
              </div>
            ))}
            {assignments.filter((a) => !a.submission && !a.isOverdue).length === 0 && (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">All assignments submitted!</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Announcements</h2>
            <Link href="/dashboard/announcements" className="text-xs text-primary-600 font-medium hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {announcements.slice(0, 4).map((a) => (
              <div key={a._id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xl mt-0.5">{getCategoryIcon(a.category)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatDate(a.createdAt)}</p>
                </div>
                {a.priority === 'urgent' && <span className="badge bg-red-50 text-red-600 border-red-200 shrink-0">Urgent</span>}
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-sm text-slate-400 py-6 text-center">No announcements</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  const colorMap = {
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100 text-emerald-600' },
    red:    { bg: 'bg-red-50',     text: 'text-red-600',     icon: 'bg-red-100 text-red-600' },
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',    icon: 'bg-blue-100 text-blue-600' },
    violet: { bg: 'bg-violet-50',  text: 'text-violet-600',  icon: 'bg-violet-100 text-violet-600' },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'bg-amber-100 text-amber-600' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="stat-card">
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
        <p className={cn('text-2xl font-bold font-display', c.text)}>{value}</p>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </div>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.icon)}>
        {icon}
      </div>
    </div>
  );
}
