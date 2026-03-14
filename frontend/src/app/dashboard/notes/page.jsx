'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesAPI, subjectAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { toast } from '@/components/ui/Toaster';
import { cn, formatDate, formatFileSize, getFileIcon, DEPARTMENTS, SEMESTERS } from '@/lib/utils';
import { Upload, Search, Download, Trash2, Filter, FileText, X } from 'lucide-react';

export default function NotesPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectAPI.getAll({ department: user?.department, semester: user?.semester }),
  });

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes', search, filterSubject],
    queryFn: () => notesAPI.getNotes({
      search: search || undefined,
      subject: filterSubject || undefined,
      department: user?.role === 'student' ? user.department : undefined,
      semester: user?.role === 'student' ? user.semester : undefined,
    }),
  });

  const notes = notesData?.data?.data || [];
  const subjects = subjectsData?.data?.data || [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Study Notes</h1>
          <p className="text-sm text-slate-500 mt-1">{notes.length} notes available</p>
        </div>
        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <button onClick={() => setShowUpload(true)} className="btn-primary">
            <Upload className="w-4 h-4" /> Upload Notes
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Search notes by title, subject, or tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative sm:w-52">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select className="input pl-10" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">All subjects</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="card py-16 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No notes found</p>
          <p className="text-sm text-slate-400 mt-1">
            {user?.role === 'faculty' ? 'Upload your first set of notes' : 'Your faculty has not uploaded notes yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => <NoteCard key={note._id} note={note} userRole={user?.role} userId={user?._id} />)}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && <UploadModal subjects={subjects} onClose={() => setShowUpload(false)} />}
    </div>
  );
}

function NoteCard({ note, userRole, userId }) {
  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => notesAPI.deleteNote(note._id),
    onSuccess: () => { toast.success('Note deleted'); qc.invalidateQueries(['notes']); },
    onError: () => toast.error('Failed to delete note'),
  });

  const canDelete = userRole === 'admin' || (userRole === 'faculty' && note.uploadedBy?._id === userId);
  const fileIcon = getFileIcon(note.fileType);

  return (
    <div className="card-hover group">
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0',
          note.fileType === 'pdf' ? 'bg-red-50' : 'bg-orange-50'
        )}>
          {fileIcon}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={note.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
          {canDelete && (
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">{note.title}</h3>
      {note.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{note.description}</p>}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="badge bg-primary-50 text-primary-700 border-primary-200">{note.subject?.code}</span>
        {note.unit && <span className="badge bg-slate-100 text-slate-600 border-slate-200">Unit {note.unit}</span>}
        <span className="badge bg-slate-100 text-slate-500 border-slate-200 uppercase">{note.fileType}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>By {note.uploadedBy?.name}</span>
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" /> {note.downloadCount} · {formatDate(note.createdAt)}
        </span>
      </div>
    </div>
  );
}

function UploadModal({ subjects, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', subjectId: '', unit: '', tags: '' });
  const [file, setFile] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: (fd) => notesAPI.uploadNote(fd),
    onSuccess: () => {
      toast.success('Notes uploaded successfully!');
      qc.invalidateQueries(['notes']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file to upload');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    fd.append('file', file);
    uploadMutation.mutate(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-display font-bold text-slate-900">Upload Notes</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g., Unit 3 — Sorting Algorithms" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subject *</label>
              <select className="input" required value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit/Chapter</label>
              <input className="input" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="e.g., 3" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of contents…" />
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g., sorting, algorithms, complexity" />
          </div>
          <div>
            <label className="label">File * (PDF, PPT, DOC — max 50MB)</label>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            />
            {file && <p className="text-xs text-slate-400 mt-1">{file.name} · {formatFileSize(file.size)}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={uploadMutation.isPending} className="btn-primary flex-1 justify-center">
              {uploadMutation.isPending ? 'Uploading…' : 'Upload Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
