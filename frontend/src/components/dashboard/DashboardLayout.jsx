'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import TopNav from '@/components/dashboard/TopNav';
import useAuthStore from '@/lib/store';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      fetchMe();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <TopNav sidebarCollapsed={collapsed} />
      <main className={cn(
        'pt-16 min-h-screen transition-all duration-300',
        collapsed ? 'pl-16' : 'pl-64'
      )}>
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
