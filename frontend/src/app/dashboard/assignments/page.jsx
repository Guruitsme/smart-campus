'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentAPI, subjectAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { toast } from '@/components/ui/Toaster';
import { cn, formatDate, formatFileSize } from '@/lib/utils';
import { Plus, Upload, Download, CheckCircle2, Clock, AlertTriangle, X, Eye } from 'lucide-react';

export default function AssignmentsPage() {
  const { user } = useAuthStore();
  return user?.role === 'student' ? <StudentAssignments /> : <FacultyAssignments />;
}

function StudentAssignments() {
  const [submitModal, setSubmitModal] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentAPI.getAssignments(),
  });
  const assignments = data?.data?.data || [];

  const pending = assignments.filter((a) => !a.submission && !a.isOverdue);
  const submitted = assignments.filter((a) => a.submission);
  const overdue = assignments.filter((a) => a.isOverdue);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Assignments</h1>
        <p className="text-sm text-slate-500 mt-1">{pending.length} pending · {submitted.length} submitted · {overdue.length} overdue</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: pending.length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Submitted', count: submitted.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Overdue', count: overdue.length, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={cn('card py-4 text-center', s.bg)}>
            <p className={cn('text-2xl font-bold font-display', s.color)}>{s.count}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a._id} className={cn(
              'card border-l-4',
              a.submission ? 'border-l-emerald-400' : a.isOverdue ? 'border-l-red-400' : 'border-l-amber-400'
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                    {a.submission && <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200">✅ Submitted</span>}
                    {a.isOverdue && <span className="badge bg-red-50 text-red-700 border-red-200">⚠ Overdue</span>}
                    {!a.submission && !a.isOverdue && <span className="badge bg-amber-50 text-amber-700 border-amber-200">Pending</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>📚 {a.subject?.name}</span>
                    <span>· 📅 Due: {formatDate(a.dueDate)}</span>
                    <span>· 🎯 {a.totalMarks} marks</span>
                  </div>
                  {a.submission?.marksObtained != null && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="badge bg-primary-50 text-primary-700 border-primary-200">
                        Marks: {a.submission.marksObtained}/{a.totalMarks}
                      </span>
                      {a.submission.feedback && <span className="text-xs text-slate-500 italic">"{a.submission.feedback}"</span>}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {a.attachmentUrl && (
                    <a href={a.attachmentUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                      <Download className="w-3.5 h-3.5" /> Question
                    </a>
                  )}
                  {!a.submission && !a.isOverdue && (
                    <button onClick={() => setSubmitModal(a)} className="btn-primary text-xs">
                      <Upload className="w-3.5 h-3.5" /> Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="card py-16 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="font-medium">No assignments yet</p>
            </div>
          )}
        </div>
      )}

      {submitModal && <SubmitModal assignment={submitModal} onClose={() => setSubmitModal(null)} />}
    </div>
  );
}

function SubmitModal({ assignment, onClose }) {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);

  const submitMutation = useMutation({
    mutationFn: (fd) => assignmentAPI.submitAssignment(assignment._id, fd),
    onSuccess: (res) => {
      toast.success(res.data.isLate ? 'Submitted (marked as late)' : 'Assignment submitted successfully!');
      qc.invalidateQueries(['assignments']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Submission failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select your submission file');
    const fd = new FormData();
    fd.append('file', file);
    submitMutation.mutate(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-display font-bold text-slate-900">Submit Assignment</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-800">{assignment.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">Due: {formatDate(assignment.dueDate)} · {assignment.totalMarks} marks</p>
          </div>
          <div>
            <label className="label">Upload your submission *</label>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx,.zip,.txt,.jpg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            />
            {file && <p className="text-xs text-slate-400 mt-1">{file.name} · {formatFileSize(file.size)}</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitMutation.isPending} className="btn-primary flex-1 justify-center">
              {submitMutation.isPending ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FacultyAssignments() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [viewSubmissions, setViewSubmissions] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['faculty-assignments'],
    queryFn: () => assignmentAPI.getAssignments(),
  });

  const { data: subsData } = useQuery({
    queryKey: ['submissions', viewSubmissions?._id],
    queryFn: () => assignmentAPI.getSubmissions(viewSubmissions._id),
    enabled: !!viewSubmissions,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => assignmentAPI.deleteAssignment(id),
    onSuccess: () => { toast.success('Assignment deleted'); qc.invalidateQueries(['faculty-assignments']); },
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, data }) => assignmentAPI.gradeSubmission(id, data),
    onSuccess: () => { toast.success('Marks saved!'); qc.invalidateQueries(['submissions', viewSubmissions?._id]); },
  });

  const assignments = data?.data?.data || [];
  const submissions = subsData?.data?.data || [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">{assignments.length} assignments created</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>📚 {a.subject?.name}</span>
                    <span>· 📅 Due: {formatDate(a.dueDate)}</span>
                    <span>· 📨 {a.submissionCount || 0} submissions</span>
                    <span>· 🎯 {a.totalMarks} marks</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setViewSubmissions(a)} className="btn-secondary text-xs">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => deleteMutation.mutate(a._id)} disabled={deleteMutation.isPending} className="btn-danger text-xs">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="card py-16 text-center text-slate-400">No assignments yet. Create one!</div>
          )}
        </div>
      )}

      {/* Submissions Panel */}
      {viewSubmissions && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Submissions — {viewSubmissions.title}</h2>
            <button onClick={() => setViewSubmissions(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                {['Student', 'Roll No', 'Submitted', 'Status', 'File', 'Marks', 'Action'].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {submissions.map((s) => (
                  <SubmissionRow key={s._id} submission={s} totalMarks={viewSubmissions.totalMarks} onGrade={(marks, feedback) => gradeMutation.mutate({ id: s._id, data: { marksObtained: marks, feedback } })} />
                ))}
                {submissions.length === 0 && (
                  <tr><td colSpan={7} className="table-cell text-center text-slate-400 py-8">No submissions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createModal && <CreateAssignmentModal onClose={() => setCreateModal(false)} />}
    </div>
  );
}

function SubmissionRow({ submission, totalMarks, onGrade }) {
  const [marks, setMarks] = useState(submission.marksObtained ?? '');
  const [feedback, setFeedback] = useState(submission.feedback || '');

  return (
    <tr className="hover:bg-slate-50/50">
      <td className="table-cell font-medium">{submission.student?.name}</td>
      <td className="table-cell text-slate-400">{submission.student?.rollNumber}</td>
      <td className="table-cell text-xs">
        {formatDate(submission.submittedAt)}
        {submission.isLate && <span className="badge bg-red-50 text-red-600 border-red-200 ml-1">Late</span>}
      </td>
      <td className="table-cell">
        <span className={cn('badge', submission.status === 'graded' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
          {submission.status}
        </span>
      </td>
      <td className="table-cell">
        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs flex items-center gap-1">
          <Download className="w-3 h-3" /> Download
        </a>
      </td>
      <td className="table-cell">
        <input type="number" min="0" max={totalMarks} value={marks} onChange={(e) => setMarks(e.target.value)}
          className="input w-16 py-1.5 text-center text-sm" placeholder="—" />
      </td>
      <td className="table-cell">
        <button
          onClick={() => onGrade(Number(marks), feedback)}
          disabled={marks === ''}
          className="btn-primary text-xs py-1.5"
        >
          Save
        </button>
      </td>
    </tr>
  );
}

function CreateAssignmentModal({ onClose }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ title: '', description: '', subjectId: '', dueDate: '', totalMarks: 10, semester: user?.semester || 1 });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectAPI.getAll({ department: user?.department }),
  });

  const createMutation = useMutation({
    mutationFn: (fd) => assignmentAPI.createAssignment(fd),
    onSuccess: () => { toast.success('Assignment created!'); qc.invalidateQueries(['faculty-assignments']); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create assignment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('department', user?.department);
    createMutation.mutate(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-display font-bold text-slate-900">Create Assignment</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Assignment title" />
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea className="input resize-none" rows={3} required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the assignment requirements…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subject *</label>
              <select className="input" required value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}>
                <option value="">Select subject</option>
                {(subjectsData?.data?.data || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semester *</label>
              <select className="input" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}>
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due Date *</label>
              <input type="datetime-local" className="input" required value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Total Marks</label>
              <input type="number" min="1" className="input" value={form.totalMarks} onChange={(e) => setForm((f) => ({ ...f, totalMarks: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
              {createMutation.isPending ? 'Creating…' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
