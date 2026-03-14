'use client';
import { Bell, Search, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { cn, getInitials, timeAgo } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function TopNav({ sidebarCollapsed }) {
  const { user } = useAuthStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationAPI.getAll({ unreadOnly: true, limit: 8 }),
    refetchInterval: 30000,
  });

  const notifications = notifData?.data?.data || [];
  const unreadCount = notifData?.data?.unreadCount || 0;

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-white border-b border-slate-100 z-20',
      'flex items-center justify-between px-6 transition-all duration-300',
      sidebarCollapsed ? 'left-16' : 'left-64'
    )}>
      {/* Left: Page date */}
      <div>
        <p className="text-xs text-slate-400">{today}</p>
        <p className="text-sm font-semibold text-slate-800 capitalize">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-slide-up z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {unreadCount > 0 && (
                  <span className="badge bg-red-50 text-red-600 border-red-100">{unreadCount} new</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className={cn('px-4 py-3 border-b border-slate-50 last:border-0', !n.isRead && 'bg-primary-50/50')}>
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100">
                <Link href="/dashboard/notifications" className="text-xs font-medium text-primary-600 hover:text-primary-700" onClick={() => setShowNotifs(false)}>
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
