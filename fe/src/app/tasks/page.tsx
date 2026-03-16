'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { Task } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Activity, ListTodo } from 'lucide-react';
import { toast } from 'sonner';

export default function TasksPage() {
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card/50 backdrop-blur-sm p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ListTodo className="w-8 h-8 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              Tasks Management
            </h2>
            <p className="text-muted-foreground whitespace-nowrap">Manage and schedule your Discord webhooks.</p>
          </div>
        </div>
        <Link href="/tasks/new">
          <Button size="lg" className="shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 whitespace-nowrap">
            <Plus className="mr-2 h-5 w-5" />
            Create New Task
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border shadow-lg bg-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b-border/60">
                <TableHead className="py-4 font-semibold text-foreground/80">Name</TableHead>
                <TableHead className="py-4 font-semibold text-foreground/80">Schedule</TableHead>
                <TableHead className="py-4 font-semibold text-foreground/80">Status</TableHead>
                <TableHead className="py-4 font-semibold text-foreground/80">Max Retry</TableHead>
                <TableHead className="py-4 font-semibold text-foreground/80">Last Updated</TableHead>
                <TableHead className="py-4 font-semibold text-foreground/80 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ListTodo className="w-8 h-8 opacity-20 animate-pulse mb-2" />
                      Loading tasks...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !tasks || tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ListTodo className="w-8 h-8 opacity-20 mb-2" />
                      No tasks found. Create one to get started.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium py-4">{task.name}</TableCell>
                    <TableCell className="py-4">
                      <code className="rounded-md bg-muted/60 px-2 py-1 font-mono text-sm border shadow-sm">
                        {task.schedule}
                      </code>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={task.status === 'active' ? 'default' : 'secondary'} className={task.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 outline-none border-emerald-500/20' : ''}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">{task.maxRetry}</TableCell>
                    <TableCell className="text-muted-foreground py-4 text-sm font-medium">
                      {format(new Date(task.updatedAt), 'MMM d, yy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      <div className="flex justify-end gap-2">
                        <Link href={`/tasks/${task.id}/logs`}>
                          <Button variant="outline" size="icon" title="View Logs" className="h-8 w-8 transition-colors hover:text-primary hover:bg-primary/10 hover:border-primary/20">
                            <Activity className="h-[1.1rem] w-[1.1rem]" />
                          </Button>
                        </Link>
                        <Link href={`/tasks/${task.id}`}>
                          <Button variant="outline" size="icon" title="Edit Task" className="h-8 w-8 transition-colors hover:text-sky-500 hover:bg-sky-500/10 hover:border-sky-500/20">
                            <Edit className="h-[1.1rem] w-[1.1rem]" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Delete Task"
                          onClick={() => handleDelete(task.id, task.name)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 transition-colors hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 text-muted-foreground"
                        >
                          <Trash2 className="h-[1.1rem] w-[1.1rem]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
