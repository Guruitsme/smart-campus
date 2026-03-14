'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, ClipboardList, Bell, BarChart3,
  Users, BookMarked, CalendarDays, MessageSquare, Settings,
  GraduationCap, FileText, PenSquare, UserCog, LogOut,
  ChevronLeft, Menu, TrendingUp, Star, Upload,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import useAuthStore from '@/lib/store';
import { useState } from 'react';

const studentLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarDays },
  { href: '/dashboard/notes', label: 'Notes', icon: BookOpen },
  { href: '/dashboard/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/dashboard/marks', label: 'Internal Marks', icon: BarChart3 },
  { href: '/dashboard/timetable', label: 'Timetable', icon: CalendarDays },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Bell },
  { href: '/dashboard/feedback', label: 'Feedback', icon: Star },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

const facultyLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/notes', label: 'Notes', icon: BookOpen },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarDays },
  { href: '/dashboard/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/dashboard/marks', label: 'Upload Marks', icon: Upload },
  { href: '/dashboard/performance', label: 'Performance', icon: TrendingUp },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Bell },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students', icon: GraduationCap },
  { href: '/dashboard/faculty', label: 'Faculty', icon: Users },
  { href: '/dashboard/subjects', label: 'Subjects', icon: BookMarked },
  { href: '/dashboard/timetable', label: 'Timetable', icon: CalendarDays },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Bell },
  { href: '/dashboard/feedback', label: 'Feedback Analytics', icon: MessageSquare },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

const roleLinks = { student: studentLinks, faculty: facultyLinks, admin: adminLinks };
const roleColors = { student: 'from-blue-600 to-indigo-600', faculty: 'from-violet-600 to-purple-600', admin: 'from-rose-600 to-pink-600' };
const roleLabels = { student: 'Student Portal', faculty: 'Faculty Portal', admin: 'Admin Portal' };

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const links = roleLinks[user?.role] || studentLinks;

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-white border-r border-slate-100 flex flex-col',
      'transition-all duration-300 z-30 shadow-sm',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className={cn('flex items-center h-16 px-4 border-b border-slate-100', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className={cn('w-8 h-8 rounded-xl gradient-campus flex items-center justify-center')}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">Smart Campus</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{roleLabels[user?.role]}</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 py-3">
        <div className="space-y-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'sidebar-link',
                  isActive && 'active',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary-600' : 'text-slate-500')} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User profile */}
      <div className={cn('p-3 border-t border-slate-100', collapsed && 'flex justify-center')}>
        {collapsed ? (
          <div className={cn('w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold', roleColors[user?.role] || 'from-slate-400 to-slate-500')}>
            {getInitials(user?.name)}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shrink-0', roleColors[user?.role] || 'from-slate-400 to-slate-500')}>
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
            <button onClick={logout} title="Logout" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
