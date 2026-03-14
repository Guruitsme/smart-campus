'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentAPI, facultyAPI, subjectAPI, adminAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { toast } from '@/components/ui/Toaster';
import { cn, EXAM_TYPES } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Upload, Plus, Trash2 } from 'lucide-react';

export default function MarksPage() {
  const { user } = useAuthStore();
  return user?.role === 'student' ? <StudentMarks /> : <FacultyMarks />;
}

// ── Student View ──────────────────────────────────────────────────────────────
function StudentMarks() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-marks'],
    queryFn: () => studentAPI.getMarks(),
  });

  const subjectData = data?.data?.data || [];

  const chartData = subjectData.map((s) => ({
    name: s.subject?.code,
    avg: s.exams.length > 0
      ? Math.round(s.exams.reduce((acc, e) => acc + (e.marksObtained / e.totalMarks) * 100, 0) / s.exams.length)
      : 0,
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Internal Marks</h1>
        <p className="text-sm text-slate-500 mt-1">Semester {data?.data?.data?.[0]?.subject?.semester || '—'} performance</p>
      </div>

      {subjectData.length === 0 && !isLoading ? (
        <div className="card py-16 text-center text-slate-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium">No marks uploaded yet</p>
          <p className="text-sm mt-1">Your faculty will upload marks after internal assessments</p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          {chartData.length > 0 && (
            <div className="card">
              <h2 className="section-title mb-5">Performance Overview</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={36}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject-wise breakdown */}
          <div className="space-y-4">
            {isLoading ? (
              [...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)
            ) : (
              subjectData.map((s) => (
                <div key={s.subject?._id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="section-title">{s.subject?.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{s.subject?.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {s.exams.length > 0
                          ? Math.round(s.exams.reduce((a, e) => a + (e.marksObtained / e.totalMarks) * 100, 0) / s.exams.length)
                          : '—'}%
                      </p>
                      <p className="text-xs text-slate-400">avg</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {s.exams.map((e, i) => (
                      <div key={i} className={cn(
                        'p-3 rounded-xl border text-center',
                        (e.marksObtained / e.totalMarks) >= 0.7 ? 'bg-emerald-50 border-emerald-200' :
                        (e.marksObtained / e.totalMarks) >= 0.5 ? 'bg-amber-50 border-amber-200' :
                        'bg-red-50 border-red-200'
                      )}>
                        <p className="text-xs font-semibold text-slate-600 mb-1">{e.examType}</p>
                        <p className="text-xl font-bold text-slate-900">{e.marksObtained}</p>
                        <p className="text-xs text-slate-400">/ {e.totalMarks}</p>
                        {e.remarks && <p className="text-[10px] text-slate-400 mt-1 italic truncate">{e.remarks}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Faculty View ──────────────────────────────────────────────────────────────
function FacultyMarks() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('IA1');
  const [totalMarks, setTotalMarks] = useState(20);
  const [semester, setSemester] = useState(user?.semester || 1);
  const [marksData, setMarksData] = useState([]);

  const { data: subjectsData } = useQuery({
    queryKey: ['faculty-subjects'],
    queryFn: () => subjectAPI.getAll({ department: user?.department }),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-for-marks', selectedSubject, semester],
    queryFn: async () => {
      const sub = (subjectsData?.data?.data || []).find((s) => s._id === selectedSubject);
      return adminAPI.getStudents({ department: user?.department, semester: sub?.semester || semester, limit: 100 });
    },
    enabled: !!selectedSubject,
    onSuccess: (data) => {
      const students = data?.data?.data || [];
      setMarksData(students.map((s) => ({ studentId: s._id, name: s.name, rollNumber: s.rollNumber, marksObtained: '', remarks: '' })));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (payload) => facultyAPI.uploadMarks(payload),
    onSuccess: () => toast.success('Marks uploaded successfully!'),
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const subject = (subjectsData?.data?.data || []).find((s) => s._id === selectedSubject);

  const handleSubmit = () => {
    if (!selectedSubject) return toast.error('Please select a subject');
    const valid = marksData.filter((m) => m.marksObtained !== '');
    if (valid.length === 0) return toast.error('Please enter at least one mark');
    const overMax = valid.find((m) => Number(m.marksObtained) > totalMarks);
    if (overMax) return toast.error(`Marks for ${overMax.name} exceed total marks (${totalMarks})`);

    uploadMutation.mutate({
      subjectId: selectedSubject,
      examType,
      totalMarks: Number(totalMarks),
      semester: subject?.semester || semester,
      department: user?.department,
      records: valid.map((m) => ({ studentId: m.studentId, marksObtained: Number(m.marksObtained), remarks: m.remarks })),
    });
  };

  const updateMark = (idx, field, value) => {
    setMarksData((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const fillAll = (val) => setMarksData((prev) => prev.map((m) => ({ ...m, marksObtained: val })));

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Upload Internal Marks</h1>
        <p className="text-sm text-slate-500 mt-1">Enter marks for students after each assessment</p>
      </div>

      {/* Controls */}
      <div className="card">
        <h2 className="section-title mb-4">Assessment Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Subject *</label>
            <select className="input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Select subject…</option>
              {(subjectsData?.data?.data || []).map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Exam Type</label>
            <select className="input" value={examType} onChange={(e) => setExamType(e.target.value)}>
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Total Marks</label>
            <input type="number" min="1" max="100" className="input" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
          </div>
          <div>
            <label className="label">Semester</label>
            <select className="input" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Marks Entry Table */}
      {selectedSubject && marksData.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="section-title">{subject?.name} — {examType}</h2>
            <div className="flex gap-2">
              <button onClick={() => fillAll(totalMarks)} className="btn-secondary text-xs">Fill Max</button>
              <button onClick={() => fillAll('')} className="btn-ghost text-xs">Clear All</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['#', 'Student Name', 'Roll No', `Marks (/${totalMarks})`, 'Remarks'].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {marksData.map((m, i) => (
                  <tr key={m.studentId} className="hover:bg-slate-50/50">
                    <td className="table-cell text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="table-cell font-medium">{m.name}</td>
                    <td className="table-cell font-mono text-xs text-slate-500">{m.rollNumber || '—'}</td>
                    <td className="table-cell w-32">
                      <input
                        type="number"
                        min="0"
                        max={totalMarks}
                        value={m.marksObtained}
                        onChange={(e) => updateMark(i, 'marksObtained', e.target.value)}
                        className={cn(
                          'input py-1.5 text-center text-sm w-20',
                          m.marksObtained !== '' && Number(m.marksObtained) > totalMarks && 'border-red-400 bg-red-50'
                        )}
                        placeholder="—"
                      />
                    </td>
                    <td className="table-cell">
                      <input
                        type="text"
                        value={m.remarks}
                        onChange={(e) => updateMark(i, 'remarks', e.target.value)}
                        className="input py-1.5 text-sm"
                        placeholder="Optional remark…"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-500">{marksData.filter((m) => m.marksObtained !== '').length} / {marksData.length} marks entered</p>
            <button
              onClick={handleSubmit}
              disabled={uploadMutation.isPending}
              className="btn-primary"
            >
              <Upload className="w-4 h-4" />
              {uploadMutation.isPending ? 'Uploading…' : 'Upload Marks'}
            </button>
          </div>
        </div>
      )}

      {selectedSubject && marksData.length === 0 && (
        <div className="card py-12 text-center text-slate-400">No students found for this subject</div>
      )}
    </div>
  );
}
