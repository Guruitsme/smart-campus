'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facultyAPI, subjectAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6'];

export default function PerformancePage() {
  const { user } = useAuthStore();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [semester, setSemester] = useState(user?.semester || 5);

  const { data: subjectsData } = useQuery({
    queryKey: ['faculty-subjects'],
    queryFn: () => subjectAPI.getAll({ department: user?.department }),
  });

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['student-performance', selectedSubject, semester],
    queryFn: () => facultyAPI.getPerformance(selectedSubject, { semester, department: user?.department }),
    enabled: !!selectedSubject,
  });

  const subjects = subjectsData?.data?.data || [];
  const performance = performanceData?.data?.data || [];

  const chartData = performance.slice(0, 20).map((p) => ({
    name: p.student?.rollNumber || p.student?.name?.split(' ')[0],
    attendance: p.attendancePercentage,
    avgMarks: p.marks.length > 0
      ? Math.round(p.marks.reduce((a, m) => a + (m.marksObtained / m.totalMarks) * 100, 0) / p.marks.length)
      : 0,
  }));

  const avgAttendance = performance.length > 0
    ? Math.round(performance.reduce((a, p) => a + p.attendancePercentage, 0) / performance.length)
    : 0;

  const lowAttendanceCount = performance.filter((p) => p.attendancePercentage < 75).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Student Performance</h1>
        <p className="text-sm text-slate-500 mt-1">Analyze attendance and marks for your classes</p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Subject</label>
            <select className="input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Select subject…</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select className="input" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedSubject && !isLoading && performance.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-2xl font-bold text-slate-900">{performance.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total Students</p>
            </div>
            <div className={cn('card text-center', avgAttendance >= 75 ? 'bg-emerald-50' : 'bg-red-50')}>
              <p className={cn('text-2xl font-bold', avgAttendance >= 75 ? 'text-emerald-600' : 'text-red-600')}>{avgAttendance}%</p>
              <p className="text-xs text-slate-500 mt-1">Avg Attendance</p>
            </div>
            <div className={cn('card text-center', lowAttendanceCount > 0 ? 'bg-amber-50' : 'bg-emerald-50')}>
              <p className={cn('text-2xl font-bold', lowAttendanceCount > 0 ? 'text-amber-600' : 'text-emerald-600')}>{lowAttendanceCount}</p>
              <p className="text-xs text-slate-500 mt-1">Below 75%</p>
            </div>
          </div>

          {/* Dual chart */}
          <div className="card">
            <h2 className="section-title mb-5">Attendance vs Performance</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="attendance" name="Attendance" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="avgMarks" name="Avg Marks" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Student table */}
          <div className="card overflow-hidden p-0">
            <div className="p-4 border-b border-slate-100">
              <h2 className="section-title">Student Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Student', 'Roll No', 'Attendance', 'Marks Summary', 'Risk'].map((h) => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {performance.map((p) => {
                    const avgMark = p.marks.length > 0
                      ? Math.round(p.marks.reduce((a, m) => a + (m.marksObtained / m.totalMarks) * 100, 0) / p.marks.length)
                      : null;
                    const isAtRisk = p.attendancePercentage < 75 || (avgMark !== null && avgMark < 40);

                    return (
                      <tr key={p.student?._id} className={cn('hover:bg-slate-50/50', isAtRisk && 'bg-red-50/30')}>
                        <td className="table-cell font-medium">{p.student?.name}</td>
                        <td className="table-cell font-mono text-xs text-slate-400">{p.student?.rollNumber}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-16 attendance-bar">
                              <div className={cn('attendance-fill', p.attendancePercentage >= 75 ? 'bg-primary-500' : 'bg-red-500')} style={{ width: `${p.attendancePercentage}%` }} />
                            </div>
                            <span className={cn('text-sm font-bold', p.attendancePercentage >= 75 ? 'text-emerald-600' : 'text-red-500')}>
                              {p.attendancePercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {p.marks.map((m, i) => (
                              <span key={i} className="badge bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                                {m.examType}: {m.marksObtained}/{m.totalMarks}
                              </span>
                            ))}
                            {p.marks.length === 0 && <span className="text-xs text-slate-400">No marks</span>}
                          </div>
                        </td>
                        <td className="table-cell">
                          {isAtRisk ? (
                            <span className="badge bg-red-50 text-red-600 border-red-200">⚠ At Risk</span>
                          ) : (
                            <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200">✓ Good</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedSubject && !isLoading && performance.length === 0 && (
        <div className="card py-12 text-center text-slate-400">No student data found for this subject</div>
      )}

      {!selectedSubject && (
        <div className="card py-12 text-center">
          <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Select a subject to view performance</p>
        </div>
      )}
    </div>
  );
}
