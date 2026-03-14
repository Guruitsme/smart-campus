'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import { cn, DEPARTMENTS, SEMESTERS } from '@/lib/utils';
import { Plus, Trash2, Edit, X, BookMarked } from 'lucide-react';

export default function SubjectsPage() {
  const qc = useQueryClient();
  const [dept, setDept] = useState('');
  const [sem, setSem] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subjects', dept, sem],
    queryFn: () => adminAPI.getSubjects({ department: dept || undefined, semester: sem || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteSubject(id),
    onSuccess: () => { toast.success('Subject deleted'); qc.invalidateQueries(['admin-subjects']); },
  });

  const subjects = data?.data?.data || [];

  // Group by semester
  const bySemester = subjects.reduce((acc, s) => {
    const key = s.semester;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="text-sm text-slate-500 mt-1">{subjects.length} subjects configured</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-3">
          <select className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input sm:w-40" value={sem} onChange={(e) => setSem(e.target.value)}>
            <option value="">All Semesters</option>
            {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="card py-16 text-center">
          <BookMarked className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No subjects found</p>
        </div>
      ) : (
        Object.entries(bySemester).sort((a, b) => Number(a[0]) - Number(b[0])).map(([semester, subs]) => (
          <div key={semester}>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary-100 text-primary-700 rounded-md flex items-center justify-center text-xs font-bold">{semester}</span>
              Semester {semester}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subs.map((s) => (
                <div key={s._id} className="card-hover group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm">
                      {s.credits}cr
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditSubject(s)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm('Delete subject?')) deleteMutation.mutate(s._id); }} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{s.name}</h3>
                  <p className="text-xs font-mono text-primary-600 mb-2">{s.code}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="badge bg-slate-100 text-slate-600 border-slate-200">{s.department}</span>
                    {s.faculty && <span className="badge bg-violet-50 text-violet-700 border-violet-200">👤 {s.faculty.name}</span>}
                    <span className={cn('badge', s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200')}>{s.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showCreate && <SubjectModal onClose={() => setShowCreate(false)} />}
      {editSubject && <SubjectModal subject={editSubject} onClose={() => setEditSubject(null)} />}
    </div>
  );
}

function SubjectModal({ subject, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!subject;
  const [form, setForm] = useState(subject ? {
    name: subject.name, code: subject.code, department: subject.department,
    semester: subject.semester, credits: subject.credits, description: subject.description || '',
  } : { name: '', code: '', department: 'Computer Science', semester: 1, credits: 3, description: '' });

  const { data: facultyData } = useQuery({
    queryKey: ['all-faculty'],
    queryFn: () => adminAPI.getFaculty({ limit: 100 }),
  });
  const [facultyId, setFacultyId] = useState(subject?.faculty?._id || '');
  const allFaculty = facultyData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? adminAPI.updateSubject(subject._id, data) : adminAPI.createSubject(data),
    onSuccess: () => { toast.success(isEdit ? 'Subject updated!' : 'Subject created!'); qc.invalidateQueries(['admin-subjects']); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-display font-bold text-slate-900">{isEdit ? 'Edit' : 'Add'} Subject</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ ...form, faculty: facultyId || undefined }); }} className="p-6 space-y-4">
          <div><label className="label">Subject Name *</label><input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Data Structures & Algorithms" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Subject Code *</label><input className="input uppercase" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CS501" /></div>
            <div><label className="label">Credits</label><input type="number" min="1" max="6" className="input" value={form.credits} onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department *</label>
              <select className="input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semester *</label>
              <select className="input" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}>
                {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Assign Faculty</label>
            <select className="input" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
              <option value="">Unassigned</option>
              {allFaculty.map((f) => <option key={f._id} value={f._id}>{f.name} ({f.department})</option>)}
            </select>
          </div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description…" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
