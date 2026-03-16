'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, tasksApi } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, XCircle, LayoutDashboard, PauseCircle, Activity, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';


export default function DashboardPage() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getSummary,
  });

  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getAll,
  });

  const isLoading = isSummaryLoading || isTasksLoading;

  const analytics = useMemo(() => {
    const taskList = tasks ?? [];
    const totalTasks = summary?.total_tasks ?? taskList.length;
    const activeTasks = summary?.active_tasks ?? taskList.filter((task) => task.status === 'active').length;
    const failedTasks = summary?.failed_tasks ?? 0;
    const pausedTasks = Math.max(totalTasks - activeTasks, 0);

    const now = new Date();
    const sevenDaysSeries = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));

      const dayKey = format(date, 'yyyy-MM-dd');
      const count = taskList.filter((task) => format(new Date(task.updatedAt), 'yyyy-MM-dd') === dayKey).length;

      return {
        label: format(date, 'EEE'),
        count,
      };
    });

    const retryBuckets = [
      { label: '0-1', count: 0 },
      { label: '2-3', count: 0 },
      { label: '4-5', count: 0 },
      { label: '6+', count: 0 },
    ];

    taskList.forEach((task) => {
      if (task.maxRetry <= 1) retryBuckets[0].count += 1;
      else if (task.maxRetry <= 3) retryBuckets[1].count += 1;
      else if (task.maxRetry <= 5) retryBuckets[2].count += 1;
      else retryBuckets[3].count += 1;
    });

    const statusSegments = [
      { label: 'Active', value: activeTasks, color: 'bg-emerald-500' },
      { label: 'Paused', value: pausedTasks, color: 'bg-amber-500' },
      { label: 'Failed', value: failedTasks, color: 'bg-rose-500' },
    ];

    const statusTotal = Math.max(statusSegments.reduce((acc, item) => acc + item.value, 0), 1);
    const topDay = [...sevenDaysSeries].sort((a, b) => b.count - a.count)[0];

    const successRate = totalTasks > 0
      ? Math.max(0, Math.min(100, Math.round(((activeTasks - failedTasks) / totalTasks) * 100)))
      : 0;

    const recentTasks = [...taskList]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      totalTasks,
      activeTasks,
      pausedTasks,
      failedTasks,
      sevenDaysSeries,
      retryBuckets,
      statusSegments,
      statusTotal,
      topDay,
      successRate,
      recentTasks,
    };
  }, [summary, tasks]);

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
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-extrabold tracking-tight bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground text-lg">Monitor your scheduled webhook events and system activity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group relative overflow-hidden border-none bg-linear-to-br from-primary/10 via-primary/5 to-transparent shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
            <div className="text-4xl font-bold text-foreground">{analytics.totalTasks}</div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Registered in system</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
            <div className="text-4xl font-bold text-foreground">{analytics.activeTasks}</div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Currently scheduled & active</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none bg-linear-to-br from-rose-500/10 via-rose-500/5 to-transparent shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
            <div className="text-4xl font-bold text-foreground">{analytics.failedTasks}</div>
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-2 font-medium">Tasks with execution errors</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-none shadow-lg bg-card/70 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                7-Day Task Activity
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-background/40 p-4">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.sevenDaysSeries} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }} 
                      dy={10} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                      labelStyle={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}
                      itemStyle={{ color: '#2563eb', fontWeight: 600 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      name="Tasks Updated"
                      stroke="#2563eb" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <p className="text-xs text-muted-foreground">Success Rate</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{analytics.successRate}%</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3">
                <p className="text-xs text-muted-foreground">Paused</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{analytics.pausedTasks}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">Peak Day</p>
                <p className="text-xl font-bold text-primary">{analytics.topDay?.label ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-card/70 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Status Highlight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {analytics.statusSegments.map((segment) => {
                const pct = Math.round((segment.value / analytics.statusTotal) * 100);
                return (
                  <div key={segment.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{segment.label}</span>
                      <span className="font-semibold">{segment.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${segment.color} animate-in slide-in-from-left duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border bg-background/40 p-3 space-y-3">
              <p className="text-sm font-semibold">Retry Distribution</p>
              <div className="space-y-2">
                {analytics.retryBuckets.map((bucket) => {
                  const maxCount = Math.max(...analytics.retryBuckets.map((item) => item.count), 1);
                  const width = Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 14 : 6);
                  return (
                    <div key={bucket.label} className="flex items-center gap-2">
                      <span className="w-10 text-xs text-muted-foreground">{bucket.label}</span>
                      <div className="h-2 flex-1 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/70 transition-all duration-700" style={{ width: `${width}%` }} />
                      </div>
                      <span className="w-6 text-right text-xs font-semibold">{bucket.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg bg-card/70 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Recent Updated Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              No task activity yet.
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.recentTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border bg-background/40 px-4 py-3 animate-in fade-in slide-in-from-right-5"
                  style={{ animationDuration: `${350 + index * 100}ms` }}
                >
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-xs text-muted-foreground">{task.schedule}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={task.status === 'active' ? 'default' : 'secondary'}
                      className={task.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/15 text-amber-600 border-amber-500/20'}
                    >
                      {task.status}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{format(new Date(task.updatedAt), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
