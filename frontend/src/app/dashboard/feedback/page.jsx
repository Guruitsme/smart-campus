'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { feedbackAPI, subjectAPI, adminAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { toast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';
import { Star, BarChart3, TrendingUp } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function FeedbackPage() {
  const { user } = useAuthStore();
  return user?.role === 'student' ? <StudentFeedback /> : <AdminFeedbackAnalytics />;
}

// ── Student: Submit Feedback ──────────────────────────────────────────────────
function StudentFeedback() {
  const { user } = useAuthStore();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [ratings, setRatings] = useState({ teachingQuality: 0, subjectKnowledge: 0, communication: 0, punctuality: 0, helpfulness: 0 });
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.department, user?.semester],
    queryFn: () => subjectAPI.getAll({ department: user?.department, semester: user?.semester }),
  });

  const subjects = subjectsData?.data?.data || [];
  const selectedSub = subjects.find((s) => s._id === selectedSubject);

  const submitMutation = useMutation({
    mutationFn: (data) => feedbackAPI.submitFeedback(data),
    onSuccess: () => {
      toast.success('Feedback submitted anonymously. Thank you!');
      setSubmitted(true);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit feedback'),
  });

  const handleSubmit = () => {
    if (!selectedSubject) return toast.error('Please select a subject');
    if (Object.values(ratings).some((r) => r === 0)) return toast.error('Please rate all categories');
    if (!selectedSub?.faculty) return toast.error('No faculty assigned to this subject');

    submitMutation.mutate({
      facultyId: selectedSub.faculty._id || selectedSub.faculty,
      subjectId: selectedSubject,
      ratings,
      comments,
      semester: user?.semester,
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    });
  };

  const ratingLabels = {
    teachingQuality:  'Teaching Quality',
    subjectKnowledge: 'Subject Knowledge',
    communication:    'Communication',
    punctuality:      'Punctuality',
    helpfulness:      'Helpfulness',
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Star className="w-10 h-10 text-emerald-500 fill-emerald-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Feedback Submitted!</h2>
        <p className="text-slate-500 max-w-sm">Your anonymous feedback has been recorded. Your response helps improve teaching quality on campus.</p>
        <button onClick={() => { setSubmitted(false); setSelectedSubject(''); setRatings({ teachingQuality: 0, subjectKnowledge: 0, communication: 0, punctuality: 0, helpfulness: 0 }); setComments(''); }}
          className="btn-primary mt-6">Submit Another</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h1 className="page-title">Faculty Feedback</h1>
        <p className="text-sm text-slate-500 mt-1">Your feedback is completely anonymous</p>
      </div>

      <div className="card border-2 border-primary-100 bg-primary-50/30">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-primary-600" />
          <p className="text-sm font-semibold text-primary-800">Anonymous Feedback</p>
        </div>
        <p className="text-sm text-primary-700">Your identity is never revealed to faculty. We only use aggregated ratings for quality improvement.</p>
      </div>

      <div className="card">
        <div className="mb-5">
          <label className="label">Select Subject</label>
          <select className="input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="">Choose a subject…</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
          </select>
        </div>

        {selectedSubject && (
          <div className="space-y-5">
            {Object.entries(ratingLabels).map(([key, label]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">{label}</label>
                  {ratings[key] > 0 && (
                    <span className="text-xs text-slate-500">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratings[key]]}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatings((r) => ({ ...r, [key]: star }))}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className={cn('w-8 h-8 transition-colors', star <= ratings[key] ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="label">Additional Comments (optional)</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share any additional thoughts or suggestions…"
                maxLength={500}
              />
              <p className="text-xs text-slate-400 text-right mt-1">{comments.length}/500</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="btn-primary w-full justify-center py-3"
            >
              {submitMutation.isPending ? 'Submitting…' : '⭐ Submit Anonymous Feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin/Faculty: Analytics ──────────────────────────────────────────────────
function AdminFeedbackAnalytics() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['feedback-analytics-all'],
    queryFn: () => feedbackAPI.getAllAnalytics(),
  });

  const analytics = data?.data?.data;
  const rankings = analytics?.facultyRankings || [];
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6'];

  const barData = rankings.slice(0, 8).map((r) => ({
    name: r.faculty?.name?.split(' ').pop() || 'Faculty',
    rating: r.avgRating,
    count: r.count,
  }));

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Feedback Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Total {analytics?.total || 0} feedback submissions</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="section-title mb-5">Faculty Ratings</h2>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barSize={36}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="rating" radius={[6, 6, 0, 0]}>
                      {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>}
            </div>

            <div className="card">
              <h2 className="section-title mb-4">Faculty Rankings</h2>
              <div className="space-y-2">
                {rankings.slice(0, 8).map((r, i) => (
                  <div key={r.faculty?._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50">
                    <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                    )}>#{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{r.faculty?.name}</p>
                      <p className="text-xs text-slate-400">{r.count} responses</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-slate-700">{r.avgRating}</span>
                    </div>
                  </div>
                ))}
                {rankings.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No feedback data available</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
