'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import { cn, formatDate, DEPARTMENTS, SEMESTERS } from '@/lib/utils';
import { Plus, Search, Filter, UserX, UserCheck, Trash2, Edit, X, GraduationCap } from 'lucide-react';

export default function StudentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [sem, setSem] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search, dept, sem, page],
    queryFn: () => adminAPI.getStudents({ search: search || undefined, department: dept || undefined, semester: sem || undefined, page, limit: 20 }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleUserStatus(id),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries(['admin-students']); },
    onError: () => toast.error('Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => { toast.success('Student deleted'); qc.invalidateQueries(['admin-students']); },
    onError: () => toast.error('Failed to delete user'),
  });

  const students = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-sm text-slate-500 mt-1">{total} students enrolled</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-10" placeholder="Search by name, email, or roll no…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input sm:w-44" value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input sm:w-36" value={sem} onChange={(e) => { setSem(e.target.value); setPage(1); }}>
            <option value="">All Semesters</option>
            {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name', 'Roll No', 'Department', 'Semester', 'Email', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="table-cell"><div className="skeleton h-4 rounded w-full" /></td>)}</tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center py-12 text-slate-400">
                  <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                  No students found
                </td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {s.name[0]}
                        </div>
                        <span className="font-medium text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-500">{s.rollNumber || '—'}</td>
                    <td className="table-cell text-slate-600">{s.department || '—'}</td>
                    <td className="table-cell"><span className="badge bg-primary-50 text-primary-700 border-primary-200">Sem {s.semester}</span></td>
                    <td className="table-cell text-slate-500">{s.email}</td>
                    <td className="table-cell">
                      <span className={cn('badge', s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200')}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => setEditUser(s)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleMutation.mutate(s._id)} className={cn('p-1.5 rounded-lg transition-colors', s.isActive ? 'hover:bg-red-50 text-slate-400 hover:text-red-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-500')}>
                          {s.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => { if (confirm('Delete this student?')) deleteMutation.mutate(s._id); }} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3">←</button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)} className={cn('btn text-xs py-1.5 px-3', page === p ? 'btn-primary' : 'btn-secondary')}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs py-1.5 px-3">→</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <UserFormModal role="student" onClose={() => setShowCreate(false)} />}
      {editUser && <UserFormModal role="student" user={editUser} onClose={() => setEditUser(null)} />}
    </div>
  );
}

function UserFormModal({ role, user, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!user;
  const [form, setForm] = useState(user ? {
    name: user.name, email: user.email, department: user.department || '', semester: user.semester || 1,
    rollNumber: user.rollNumber || '', section: user.section || 'A', admissionYear: user.admissionYear || new Date().getFullYear(),
  } : { name: '', email: '', password: '', role, department: '', semester: 1, rollNumber: '', section: 'A', admissionYear: new Date().getFullYear() });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? adminAPI.updateUser(user._id, data) : adminAPI.createUser({ ...data, role }),
    onSuccess: () => { toast.success(isEdit ? 'Student updated!' : 'Student created!'); qc.invalidateQueries(['admin-students']); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(form); };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-display font-bold text-slate-900">{isEdit ? 'Edit' : 'Add'} Student</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          {!isEdit && (
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" required value={form.password || ''} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Roll Number</label>
              <input className="input" value={form.rollNumber} onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))} />
            </div>
            <div>
              <label className="label">Section</label>
              <input className="input" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
                <option value="">Select…</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semester</label>
              <select className="input" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}>
                {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
