'use client';

import { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Activity,
  ListTodo,
  X,
  Clock3,
  Timer,
  Siren,
  LayoutGrid,
  Rows3,
} from 'lucide-react';
import { toast } from 'sonner';
import TaskForm from '@/components/task-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function TasksContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const editingTaskId = searchParams.get('edit');
  const isCreateModalOpen = searchParams.get('create') === '1' && !editingTaskId;

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      toast.success('Task deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete task "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateModal = () => {
    router.replace('/tasks?create=1');
  };

  const closeCreateModal = () => {
    router.replace('/tasks');
  };

  const openEditModal = (taskId: string) => {
    router.replace(`/tasks?edit=${taskId}`);
  };

  const closeEditModal = () => {
    router.replace('/tasks');
  };

  const totalTasks = tasks?.length ?? 0;
  const activeTasks = tasks?.filter((task) => task.status === 'active').length ?? 0;
  const pausedTasks = tasks?.filter((task) => task.status === 'paused').length ?? 0;
  const avgRetry = totalTasks
    ? Math.round(
      (tasks?.reduce((acc, task) => acc + Number(task.maxRetry || 0), 0) ?? 0) /
      totalTasks,
    )
    : 0;

  return (
    <>
      <div className="relative rounded-3xl min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden transition-colors duration-500">
        {/* Dynamic 3D Background Elements */}
        <div className="fixed -top-[10%] -left-[10%] h-[700px] w-[700px] rounded-full bg-violet-600/20 dark:bg-violet-600/10 blur-[150px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-in fade-in duration-1000" />
        <div className="fixed top-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-blue-600/20 dark:bg-blue-600/10 blur-[180px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-in fade-in slide-in-from-right-12 duration-1000 delay-300" />
        <div className="fixed -bottom-[20%] left-[20%] h-[600px] w-[600px] rounded-full bg-indigo-600/20 dark:bg-indigo-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500" />

        <div className="relative z-10 px-4 py-8 md:px-8 space-y-8 animate-in fade-in zoom-in-[0.98] duration-700 pb-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-[2rem] border border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-black/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-500">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:to-fuchsia-500/20 border border-violet-200 dark:border-white/10 shadow-inner">
                <ListTodo className="h-7 w-7 text-violet-600 dark:text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.3)] dark:drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-white/50 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:drop-shadow-sm">
                  Tasks Management
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Manage and schedule your Discord webhooks.
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={openCreateModal}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.2)] dark:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-0.5 whitespace-nowrap border border-white/20 dark:border-white/10"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Task
              </span>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="group rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all hover:bg-white/90 dark:hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] dark:hover:shadow-[0_8px_30px_rgba(139,92,246,0.2)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
                  <ListTodo className="h-4 w-4 text-violet-600 dark:text-violet-400 drop-shadow-[0_0_5px_rgba(139,92,246,0.3)] dark:drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white drop-shadow-sm">{totalTasks}</p>
            </div>

            <div className="group rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all hover:bg-white/90 dark:hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</p>
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)] dark:drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)] dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                {activeTasks}
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all hover:bg-white/90 dark:hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_8px_30px_rgba(245,158,11,0.2)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Paused</p>
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  <Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)] dark:drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-600 dark:text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.2)] dark:drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                {pausedTasks}
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all hover:bg-white/90 dark:hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)] dark:hover:shadow-[0_8px_30px_rgba(244,63,94,0.2)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Max Retry</p>
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                  <Siren className="h-4 w-4 text-rose-600 dark:text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.3)] dark:drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white drop-shadow-sm">{avgRetry}</p>
            </div>
          </div>

          {/* Task List Section */}
          <div className="rounded-[2rem] border border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-black/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl p-6 md:p-8 transition-colors duration-500">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:drop-shadow-sm">Task List</h3>

              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20 px-3 py-1 text-sm shadow-inner">
                  {totalTasks} items
                </Badge>

                <div className="flex items-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-black/40 p-1 shadow-inner backdrop-blur-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('card')}
                    className={`h-8 px-3 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-0' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                  >
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Card
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className={`h-8 px-3 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-0' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                  >
                    <Rows3 className="mr-2 h-4 w-4" />
                    Table
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 border-dashed bg-slate-50/50 dark:bg-white/5 py-16 text-center text-slate-500 dark:text-slate-400 backdrop-blur-sm">
                <ListTodo className="mx-auto mb-4 h-10 w-10 animate-pulse text-violet-400/50" />
                Loading tasks...
              </div>
            ) : !tasks || tasks.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 border-dashed bg-slate-50/50 dark:bg-white/5 py-16 text-center text-slate-500 dark:text-slate-400 backdrop-blur-sm">
                <ListTodo className="mx-auto mb-4 h-10 w-10 text-slate-400 dark:text-slate-600" />
                No tasks found. Create one to get started.
              </div>
            ) : viewMode === 'card' ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="group relative flex flex-col justify-between rounded-[1.5rem] border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_40px_-10px_rgba(139,92,246,0.15)] dark:hover:shadow-[0_10px_40px_-10px_rgba(139,92,246,0.3)] hover:bg-white dark:hover:bg-white/10"
                  >
                    {/* Subtle internal shine */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.8] dark:from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[1.5rem]" />

                    <div>
                      <div className="mb-4 flex items-start justify-between gap-3 relative z-10">
                        <div>
                          <h4 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:drop-shadow-sm">{task.name}</h4>
                          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Updated {format(new Date(task.updatedAt), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                        <Badge
                          variant={task.status === 'active' ? 'default' : 'secondary'}
                          className={
                            task.status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-inner'
                              : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 shadow-inner'
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>

                      <div className="mb-6 space-y-3 relative z-10">
                        <div className="flex items-center gap-2.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/60 dark:border-white/5 px-3 py-2.5 shadow-inner">
                          <Timer className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          <code className="truncate text-xs font-mono text-slate-600 dark:text-slate-300">{task.schedule}</code>
                        </div>

                        <div className="flex items-center justify-between text-sm px-1">
                          <span className="text-slate-500 dark:text-slate-400">Max Retry</span>
                          <span className="font-bold text-slate-800 dark:text-white">{task.maxRetry}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-200/80 dark:border-white/10 pt-4 relative z-10">
                      <Link href={`/tasks/${task.id}/logs`}>
                        <Button
                          variant="outline"
                          size="icon"
                          title="View Logs"
                          className="h-9 w-9 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all shadow-sm"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Edit Task"
                        onClick={() => openEditModal(task.id)}
                        className="h-9 w-9 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20 hover:border-sky-300 dark:hover:border-sky-500/30 transition-all shadow-sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Delete Task"
                        onClick={() => handleDelete(task.id, task.name)}
                        disabled={deleteMutation.isPending}
                        className="h-9 w-9 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-white/5 shadow-inner backdrop-blur-md">
                <Table>
                  <TableHeader className="bg-slate-100/50 dark:bg-black/40 border-b border-slate-200/80 dark:border-white/10">
                    <TableRow className="hover:bg-transparent border-0">
                      <TableHead className="w-[28%] text-slate-600 dark:text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-300">Schedule</TableHead>
                      <TableHead className="w-[14%] text-slate-600 dark:text-slate-300">Status</TableHead>
                      <TableHead className="w-[12%] text-slate-600 dark:text-slate-300">Max Retry</TableHead>
                      <TableHead className="w-[20%] text-slate-600 dark:text-slate-300">Last Updated</TableHead>
                      <TableHead className="w-[16%] text-right text-slate-600 dark:text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id} className="border-b border-slate-200/50 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/5 transition-colors">
                        <TableCell className="font-semibold text-slate-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:drop-shadow-sm">{task.name}</TableCell>
                        <TableCell>
                          <code className="rounded-lg bg-slate-100 dark:bg-black/40 px-2.5 py-1.5 font-mono text-xs border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-inner">
                            {task.schedule}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={task.status === 'active' ? 'default' : 'secondary'}
                            className={
                              task.status === 'active'
                                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-inner'
                                : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 shadow-inner'
                            }
                          >
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-slate-800 dark:text-white">{task.maxRetry}</TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                          {format(new Date(task.updatedAt), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/tasks/${task.id}/logs`}>
                              <Button
                                variant="outline"
                                size="icon"
                                title="View Logs"
                                className="h-8 w-8 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/40 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all"
                              >
                                <Activity className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Edit Task"
                              onClick={() => openEditModal(task.id)}
                              className="h-8 w-8 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/40 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20 hover:border-sky-300 dark:hover:border-sky-500/30 transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Delete Task"
                              onClick={() => handleDelete(task.id, task.name)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/40 text-slate-600 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity" onClick={closeCreateModal} />
          <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/90 shadow-[0_0_50px_-12px_rgba(0,0,0,0.15),0_25px_50px_-12px_rgba(139,92,246,0.15)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.8),0_25px_50px_-12px_rgba(139,92,246,0.3)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-black/40 px-6 py-5 backdrop-blur-xl">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:drop-shadow-sm">Create New Task</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Configure webhook schedule with complete settings.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeCreateModal} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-full h-10 w-10">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <TaskForm mode="modal" onCancel={closeCreateModal} onSuccess={closeCreateModal} />
            </div>
          </div>
        </div>
      )}

      {editingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity" onClick={closeEditModal} />
          <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/90 shadow-[0_0_50px_-12px_rgba(0,0,0,0.15),0_25px_50px_-12px_rgba(14,165,233,0.15)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.8),0_25px_50px_-12px_rgba(14,165,233,0.3)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-black/40 px-6 py-5 backdrop-blur-xl">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:drop-shadow-sm">Edit Task</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Update webhook schedule and task configuration.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeEditModal} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-full h-10 w-10">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <TaskForm taskId={editingTaskId} mode="modal" onCancel={closeEditModal} onSuccess={closeEditModal} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <TasksContent />
    </Suspense>
  );
}
