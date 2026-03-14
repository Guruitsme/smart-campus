'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import { cn, timeAgo } from '@/lib/utils';
import { Bell, CheckCheck, Trash2, BellOff } from 'lucide-react';

const typeIcons = {
  announcement:     '📢',
  attendance_alert: '⚠️',
  assignment:       '📝',
  marks:            '📊',
  feedback:         '⭐',
  general:          '🔔',
};

const typeBg = {
  announcement:     'border-l-blue-400',
  attendance_alert: 'border-l-red-400',
  assignment:       'border-l-amber-400',
  marks:            'border-l-emerald-400',
  feedback:         'border-l-violet-400',
  general:          'border-l-slate-300',
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getAll({ limit: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => { toast.success('All notifications marked as read'); qc.invalidateQueries(['notifications']); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationAPI.delete(id),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const notifications = data?.data?.data || [];
  const unreadCount = data?.data?.unreadCount || 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="btn-secondary text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card py-20 text-center">
          <BellOff className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No notifications</p>
          <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markReadMutation.mutate(n._id)}
              className={cn(
                'card border-l-4 flex items-start gap-3 cursor-pointer transition-all hover:shadow-card-hover',
                typeBg[n.type] || 'border-l-slate-300',
                !n.isRead ? 'bg-white' : 'bg-slate-50/50'
              )}
            >
              <div className="text-2xl mt-0.5 shrink-0">{typeIcons[n.type] || '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm', !n.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-600')}>
                    {n.title}
                  </p>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1.5">{timeAgo(n.createdAt)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(n._id); }}
                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
