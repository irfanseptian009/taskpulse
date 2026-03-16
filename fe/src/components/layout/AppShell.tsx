"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MainLayout } from '@/components/layout/MainLayout';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-muted/10 dark:bg-background">
      <AppSidebar />
      <MainLayout>{children}</MainLayout>
    </div>
  );
}
