'use client';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '@/lib/store';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import FacultyDashboard from '@/components/dashboard/FacultyDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return <DashboardSkeleton />;
  if (user.role === 'faculty') return <FacultyDashboard />;
  if (user.role === 'admin') return <AdminDashboard />;
  return <StudentDashboard />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}
