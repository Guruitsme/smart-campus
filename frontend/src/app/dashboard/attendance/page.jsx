'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceAPI, subjectAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { cn, getAttendanceBg, formatDate, SEMESTERS } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';
import { CheckCircle2, XCircle, Clock, Save, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AttendancePage() {
  const { user } = useAuthStore();
  return user?.role === 'student' ? <StudentAttendance /> : <FacultyAttendance />;
}

// ── Student View ──────────────────────────────────────────────────────────────
function StudentAttendance() {
  const { data } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => attendanceAPI.getMyAttendance(),
  });
  const attendance = data?.data?.data || [];
  const overall = attendance.length > 0
    ? Math.round(attendance.reduce((s, a) => s + a.percentage, 0) / attendance.length)
    : 0;

  const chartData = attendance.map((a) => ({
    name: a.subject?.code || '—',
    percentage: a.percentage,
  }));

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">My Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Semester {data?.data?.data?.[0]?.subject?.semester || '—'}</p>
      </div>

      {overall < 75 && overall > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            Your overall attendance is <strong>{overall}%</strong> — below the required 75%. Improve attendance to avoid academic restrictions.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold font-display text-primary-600">{overall}%</p>
          <p className="text-xs text-slate-500 mt-1">Overall</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold font-display text-emerald-600">{attendance.filter((a) => a.percentage >= 75).length}</p>
          <p className="text-xs text-slate-500 mt-1">On Track</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold font-display text-red-500">{attendance.filter((a) => a.percentage < 75).length}</p>
          <p className="text-xs text-slate-500 mt-1">Low Attendance</p>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-5">Subject-wise Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.percentage >= 75 ? '#6366f1' : '#f43f5e'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed table */}
      <div className="card">
        <h2 className="section-title mb-4">Subject Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              {['Subject', 'Present', 'Absent', 'Total', 'Percentage', 'Status'].map((h) => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {attendance.map((a) => (
                <tr key={a.subject?._id} className="hover:bg-slate-50/50">
                  <td className="table-cell">
                    <p className="font-medium text-slate-800">{a.subject?.name}</p>
                    <p className="text-xs text-slate-400">{a.subject?.code}</p>
                  </td>
                  <td className="table-cell text-emerald-600 font-medium">{a.present}</td>
                  <td className="table-cell text-red-500 font-medium">{a.absent}</td>
                  <td className="table-cell text-slate-500">{a.total}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-20 attendance-bar">
                        <div className={cn('attendance-fill', a.percentage >= 75 ? 'bg-primary-500' : 'bg-red-500')} style={{ width: `${a.percentage}%` }} />
                      </div>
                      <span className={cn('text-sm font-bold', a.percentage >= 85 ? 'text-emerald-600' : a.percentage >= 75 ? 'text-amber-500' : 'text-red-500')}>
                        {a.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={cn('badge', getAttendanceBg(a.percentage))}>
                      {a.percentage >= 75 ? 'Good' : a.isLow ? '⚠ Low' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr><td colSpan={6} className="table-cell text-center text-slate-400 py-10">No attendance records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Faculty View ──────────────────────────────────────────────────────────────
function FacultyAttendance() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [students, setStudents] = useState([]);

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.department],
    queryFn: () => subjectAPI.getAll({ department: user?.department }),
  });

  // Load students when subject selected
  const { data: studentsData } = useQuery({
    queryKey: ['students-for-attendance', selectedSubject],
    queryFn: async () => {
      const { adminAPI } = await import('@/lib/api');
      const subject = subjectsData?.data?.data?.find((s) => s._id === selectedSubject);
      return adminAPI.getStudents({ department: user?.department, semester: subject?.semester, limit: 100 });
    },
    enabled: !!selectedSubject,
    onSuccess: (data) => {
      const studentList = data?.data?.data || [];
      setStudents(studentList);
      const init = {};
      studentList.forEach((s) => { init[s._id] = 'present'; });
      setRecords(init);
    },
  });

  const markMutation = useMutation({
    mutationFn: (payload) => attendanceAPI.markAttendance(payload),
    onSuccess: () => {
      toast.success('Attendance marked successfully!');
      qc.invalidateQueries(['faculty-dashboard']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to mark attendance'),
  });

  const subject = subjectsData?.data?.data?.find((s) => s._id === selectedSubject);
  const studentList = studentsData?.data?.data || [];

  const toggle = (studentId, status) => setRecords((r) => ({ ...r, [studentId]: status }));
  const markAll = (status) => {
    const updated = {};
    studentList.forEach((s) => { updated[s._id] = status; });
    setRecords(updated);
  };

  const handleSubmit = () => {
    if (!selectedSubject) return toast.error('Please select a subject');
    if (studentList.length === 0) return toast.error('No students found');
    markMutation.mutate({
      subjectId: selectedSubject,
      date,
      semester: subject?.semester,
      department: user?.department,
      records: studentList.map((s) => ({ studentId: s._id, status: records[s._id] || 'absent' })),
    });
  };

  const presentCount = Object.values(records).filter((s) => s === 'present').length;
  const absentCount = Object.values(records).filter((s) => s === 'absent').length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Mark Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Record student attendance for your classes</p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Subject</label>
            <select className="input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Select subject…</option>
              {(subjectsData?.data?.data || []).map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => markAll('present')} className="btn-secondary flex-1 justify-center text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> All Present
            </button>
            <button onClick={() => markAll('absent')} className="btn-secondary flex-1 justify-center text-xs">
              <XCircle className="w-3.5 h-3.5 text-red-500" /> All Absent
            </button>
          </div>
        </div>
      </div>

      {selectedSubject && studentList.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
              <p className="text-xs text-slate-500 mt-1">Present</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-red-500">{absentCount}</p>
              <p className="text-xs text-slate-500 mt-1">Absent</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-slate-700">{studentList.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total</p>
            </div>
          </div>

          {/* Student list */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Students — {subject?.name}</h2>
              <span className="badge bg-primary-50 text-primary-700 border-primary-200">{formatDate(date)}</span>
            </div>
            <div className="space-y-2">
              {studentList.map((s) => (
                <div key={s._id} className={cn(
                  'flex items-center justify-between p-3.5 rounded-xl border transition-colors',
                  records[s._id] === 'present' ? 'bg-emerald-50 border-emerald-200' :
                  records[s._id] === 'late' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                )}>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.rollNumber}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { status: 'present', icon: <CheckCircle2 className="w-4 h-4" />, label: 'P', active: 'bg-emerald-500 text-white', inactive: 'bg-white text-slate-500 border border-slate-200' },
                      { status: 'late',    icon: <Clock className="w-4 h-4" />,         label: 'L', active: 'bg-amber-500 text-white',  inactive: 'bg-white text-slate-500 border border-slate-200' },
                      { status: 'absent',  icon: <XCircle className="w-4 h-4" />,       label: 'A', active: 'bg-red-500 text-white',    inactive: 'bg-white text-slate-500 border border-slate-200' },
                    ].map((btn) => (
                      <button
                        key={btn.status}
                        onClick={() => toggle(s._id, btn.status)}
                        className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all', records[s._id] === btn.status ? btn.active : btn.inactive)}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={markMutation.isPending}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                {markMutation.isPending ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </>
      )}

      {selectedSubject && studentList.length === 0 && (
        <div className="card text-center py-12 text-slate-400">
          <p>No students found for this subject</p>
        </div>
      )}
    </div>
  );
}
