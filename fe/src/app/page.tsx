'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, XCircle, LayoutDashboard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getSummary,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your scheduled tasks.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-none shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-24" /></CardTitle>
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground text-lg">Monitor your scheduled webhook events and system activity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300 group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <LayoutDashboard className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Total Tasks</CardTitle>
            <div className="p-2 bg-primary/20 rounded-full">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-foreground">{data?.total_tasks || 0}</div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Registered in system</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300 group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-24 h-24 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Active Tasks</CardTitle>
            <div className="p-2 bg-emerald-500/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-foreground">{data?.active_tasks || 0}</div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Currently scheduled & active</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent backdrop-blur-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300 group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <XCircle className="w-24 h-24 text-rose-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Failed Tasks</CardTitle>
            <div className="p-2 bg-rose-500/20 rounded-full">
              <XCircle className="h-5 w-5 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-foreground">{data?.failed_tasks || 0}</div>
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-2 font-medium">Tasks with execution errors</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        {/* Placeholder for future charts/activity list */}
        <div className="p-8 rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground font-medium">Activity Chart / Logs</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
