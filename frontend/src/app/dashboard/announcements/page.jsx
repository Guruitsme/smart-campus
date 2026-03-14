'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { toast } from '@/components/ui/Toaster';
import { cn, formatDateTime, getCategoryIcon, getPriorityBadge, DEPARTMENTS } from '@/lib/utils';
import { Plus, X, Bell, ChevronDown, ChevronRight } from 'lucide-react';

const CATEGORIES = ['general', 'exam', 'event', 'holiday', 'assignment', 'result', 'placement', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', filter],
    queryFn: () => announcementAPI.getAnnouncements({ category: filter || undefined, limit: 50 }),
  });

  const announcements = data?.data?.data || [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">{announcements.length} notices</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'faculty') && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={cn('px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all', !filter ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300')}>
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(filter === cat ? '' : cat)}
            className={cn('px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize', filter === cat ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300')}
          >
            {getCategoryIcon(cat)} {cat}
          </button>
        ))}
      </div>

      {/* Announcements list */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : announcements.length === 0 ? (
        <div className="card py-16 text-center">
          <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No announcements found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a._id} className={cn(
              'card cursor-pointer transition-shadow hover:shadow-card-hover',
              a.priority === 'urgent' && 'border-l-4 border-l-red-500',
              a.priority === 'high' && 'border-l-4 border-l-orange-400'
            )}>
              <div
                className="flex items-start gap-3"
                onClick={() => setExpanded(expanded === a._id ? null : a._id)}
              >
                <span className="text-2xl mt-0.5 shrink-0">{getCategoryIcon(a.category)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                    <span className={cn('badge capitalize', getPriorityBadge(a.priority))}>{a.priority}</span>
                    <span className="badge bg-slate-100 text-slate-500 border-slate-200 capitalize">{a.category}</span>
                  </div>
                  {expanded !== a._id && (
                    <p className="text-sm text-slate-500 line-clamp-2">{a.content}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>By {a.createdBy?.name}</span>
                    <span>·</span>
                    <span>{formatDateTime(a.createdAt)}</span>
                    <span>·</span>
                    <span>{a.viewCount} views</span>
                  </div>
                </div>
                <span className="shrink-0 text-slate-400 mt-1">
                  {expanded === a._id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </div>

              {expanded === a._id && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{a.content}</p>
                  {a.attachmentUrl && (
                    <a href={a.attachmentUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary-600 font-medium hover:underline">
                      📎 View attachment
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateAnnouncementModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateAnnouncementModal({ onClose }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    title: '', content: '', priority: 'medium', category: 'general',
    targetRoles: ['all'], expiresAt: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => announcementAPI.create(data),
    onSuccess: () => { toast.success('Announcement posted!'); qc.invalidateQueries(['announcements']); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to post announcement'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, expiresAt: form.expiresAt || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-display font-bold text-slate-900">Post Announcement</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Announcement title" />
          </div>
          <div>
            <label className="label">Content *</label>
            <textarea className="input resize-none" rows={4} required value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Write the full announcement…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input capitalize" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{getCategoryIcon(c)} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input capitalize" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Audience</label>
            <div className="flex gap-2 flex-wrap">
              {['all', 'student', 'faculty', 'admin'].map((role) => (
                <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.targetRoles.includes(role)}
                    onChange={(e) => {
                      if (role === 'all') {
                        setForm((f) => ({ ...f, targetRoles: e.target.checked ? ['all'] : [] }));
                      } else {
                        setForm((f) => ({
                          ...f,
                          targetRoles: e.target.checked
                            ? [...f.targetRoles.filter((r) => r !== 'all'), role]
                            : f.targetRoles.filter((r) => r !== role),
                        }));
                      }
                    }}
                    className="w-4 h-4 rounded text-primary-600"
                  />
                  <span className="text-sm capitalize text-slate-700">{role}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Expires At (optional)</label>
            <input type="datetime-local" className="input" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
              {createMutation.isPending ? 'Posting…' : '📢 Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
