'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentAPI, adminAPI, subjectAPI } from '@/lib/api';
import useAuthStore from '@/lib/store';
import { toast } from '@/components/ui/Toaster';
import { cn, getDayName, DEPARTMENTS, SEMESTERS } from '@/lib/utils';
import { Plus, Save, X } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const PERIOD_COLORS = ['bg-blue-50 border-blue-200', 'bg-violet-50 border-violet-200', 'bg-emerald-50 border-emerald-200', 'bg-amber-50 border-amber-200', 'bg-rose-50 border-rose-200', 'bg-teal-50 border-teal-200'];

export default function TimetablePage() {
  const { user } = useAuthStore();
  return user?.role === 'admin' ? <AdminTimetable /> : <StudentTimetable />;
}

// ── Student View ──────────────────────────────────────────────────────────────
function StudentTimetable() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const [activeDay, setActiveDay] = useState(today !== 'sunday' ? today : 'monday');

  const { data, isLoading } = useQuery({
    queryKey: ['timetable'],
    queryFn: () => studentAPI.getTimetable(),
  });

  const timetable = data?.data?.data;
  const schedule = timetable?.schedule || {};
  const currentPeriods = schedule[activeDay] || [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Timetable</h1>
        <p className="text-sm text-slate-500 mt-1">
          {timetable?.department} · Semester {timetable?.semester} · Section {timetable?.section}
        </p>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all',
              activeDay === day
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300',
              day === today && activeDay !== day && 'border-primary-300 text-primary-700'
            )}
          >
            {getDayName(day).slice(0, 3)}
            {day === today && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 inline-block" />}
          </button>
        ))}
      </div>

      {/* Periods */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : !timetable ? (
        <div className="card py-16 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-slate-500 font-medium">Timetable not available</p>
          <p className="text-sm text-slate-400 mt-1">Ask your admin to upload the timetable</p>
        </div>
      ) : currentPeriods.length === 0 ? (
        <div className="card py-10 text-center text-slate-400">No classes on {getDayName(activeDay)}</div>
      ) : (
        <div className="space-y-3">
          {currentPeriods.map((period, i) => (
            <div key={i} className={cn('card border-l-4', period.type === 'free' ? 'border-l-slate-200 bg-slate-50' : 'border-l-primary-400')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[70px]">
                    <p className="text-sm font-bold text-slate-900">{period.startTime}</p>
                    <p className="text-xs text-slate-400">↓</p>
                    <p className="text-sm font-bold text-slate-900">{period.endTime}</p>
                  </div>
                  <div className="w-px h-12 bg-slate-200" />
                  <div>
                    {period.type === 'free' ? (
                      <p className="text-sm font-medium text-slate-400">Free Period</p>
                    ) : (
                      <>
                        <p className="text-base font-semibold text-slate-900">{period.subject?.name || 'Subject'}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {period.faculty?.name && `👤 ${period.faculty.name}`}
                          {period.room && ` · 🏫 ${period.room}`}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={cn('badge capitalize',
                    period.type === 'lab' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                    period.type === 'tutorial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    period.type === 'free' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                    'bg-primary-50 text-primary-700 border-primary-200'
                  )}>
                    {period.type || 'lecture'}
                  </span>
                  {period.subject?.code && (
                    <span className="text-xs font-mono text-slate-400">{period.subject.code}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full week overview */}
      {timetable && (
        <div className="card">
          <h2 className="section-title mb-4">Week Overview</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {DAYS.map((day) => {
              const periods = (schedule[day] || []).filter((p) => p.type !== 'free');
              return (
                <div
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={cn('p-2.5 rounded-xl border cursor-pointer text-center transition-all', activeDay === day ? 'bg-primary-50 border-primary-200' : 'hover:bg-slate-50 border-slate-100')}
                >
                  <p className={cn('text-xs font-semibold', activeDay === day ? 'text-primary-700' : 'text-slate-600')}>{getDayName(day).slice(0, 3)}</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{periods.length}</p>
                  <p className="text-[10px] text-slate-400">classes</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin View ────────────────────────────────────────────────────────────────
function AdminTimetable() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [dept, setDept] = useState('Computer Science');
  const [sem, setSem] = useState(5);
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [schedule, setSchedule] = useState(() => {
    const s = {};
    DAYS.forEach((d) => { s[d] = []; });
    return s;
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-timetable', dept, sem],
    queryFn: () => subjectAPI.getAll({ department: dept, semester: sem }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => adminAPI.uploadTimetable(payload),
    onSuccess: () => toast.success('Timetable saved successfully!'),
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const addPeriod = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], { startTime: '09:00', endTime: '10:00', subject: '', faculty: '', room: '', type: 'lecture' }],
    }));
  };

  const removePeriod = (day, i) => {
    setSchedule((prev) => ({ ...prev, [day]: prev[day].filter((_, idx) => idx !== i) }));
  };

  const updatePeriod = (day, i, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((p, idx) => idx === i ? { ...p, [field]: value } : p),
    }));
  };

  const subjects = subjectsData?.data?.data || [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Manage Timetable</h1>
        <p className="text-sm text-slate-500 mt-1">Create and upload class schedules</p>
      </div>

      {/* Config */}
      <div className="card">
        <h2 className="section-title mb-4">Timetable Configuration</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Department</label>
            <select className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select className="input" value={sem} onChange={(e) => setSem(Number(e.target.value))}>
              {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <input className="input" value={section} onChange={(e) => setSection(e.target.value)} placeholder="A" />
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2024-25" />
          </div>
        </div>
      </div>

      {/* Day-wise schedule builder */}
      {DAYS.map((day) => (
        <div key={day} className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">{getDayName(day)}</h2>
            <button onClick={() => addPeriod(day)} className="btn-secondary text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Period
            </button>
          </div>

          {schedule[day].length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
              No periods added. Click "Add Period" to start building.
            </div>
          ) : (
            <div className="space-y-3">
              {schedule[day].map((period, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">START</label>
                    <input type="time" className="input py-1.5 text-sm" value={period.startTime} onChange={(e) => updatePeriod(day, i, 'startTime', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">END</label>
                    <input type="time" className="input py-1.5 text-sm" value={period.endTime} onChange={(e) => updatePeriod(day, i, 'endTime', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">SUBJECT</label>
                    <select className="input py-1.5 text-sm" value={period.subject} onChange={(e) => updatePeriod(day, i, 'subject', e.target.value)}>
                      <option value="">Free Period</option>
                      {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">TYPE</label>
                    <select className="input py-1.5 text-sm" value={period.type} onChange={(e) => updatePeriod(day, i, 'type', e.target.value)}>
                      {['lecture', 'lab', 'tutorial', 'free'].map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold text-slate-500 mb-1 block">ROOM</label>
                      <input className="input py-1.5 text-sm" value={period.room} onChange={(e) => updatePeriod(day, i, 'room', e.target.value)} placeholder="e.g. A-101" />
                    </div>
                    <button onClick={() => removePeriod(day, i)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 mb-px transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Save button */}
      <div className="flex justify-end sticky bottom-4">
        <button
          onClick={() => saveMutation.mutate({ department: dept, semester: sem, section, academicYear, schedule })}
          disabled={saveMutation.isPending}
          className="btn-primary shadow-lg px-8"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Timetable'}
        </button>
      </div>
    </div>
  );
}
