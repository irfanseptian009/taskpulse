'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import cronstrue from 'cronstrue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function TaskForm({ taskId }: { taskId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!taskId;

  const [cronPreview, setCronPreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    schedule: '',
    webhookUrl: '',
    payloadJson: '',
    maxRetry: 3,
    status: 'active',
  });

  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksApi.getOne(taskId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        schedule: task.schedule,
        webhookUrl: task.webhookUrl,
        payloadJson: JSON.stringify(task.payloadJson, null, 2),
        maxRetry: task.maxRetry,
        status: task.status,
      });
    }
  }, [task]);

  useEffect(() => {
    try {
      if (formData.schedule) {
        setCronPreview(cronstrue.toString(formData.schedule));
      } else {
        setCronPreview('');
      }
    } catch (e) {
      setCronPreview('Invalid cron expression');
    }
  }, [formData.schedule]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Validate JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(data.payloadJson);
      } catch (e) {
        throw new Error('Invalid JSON payload');
      }

      const payload = {
        ...data,
        maxRetry: Number(data.maxRetry),
        payloadJson: parsedJson,
      };

      if (isEditing) {
        return tasksApi.update(taskId!, payload);
      }
      return tasksApi.create(payload);
    },
    onSuccess: () => {
      toast.success(`Task ${isEditing ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push('/tasks');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save task');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isEditing && isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Task' : 'Create Task'}
          </h2>
          <p className="text-muted-foreground">
            Configure your Discord webhook schedule.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>All fields are required unless marked otherwise.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Task Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Daily DB Backup Notification"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule">Crontab Schedule</Label>
                <Input
                  id="schedule"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  placeholder="*/5 * * * *"
                  required
                />
                <p className="text-xs text-muted-foreground h-4">
                  {cronPreview && <span className={cronPreview === 'Invalid cron expression' ? 'text-destructive' : 'text-primary'}>{cronPreview}</span>}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRetry">Max Retries</Label>
                <Input
                  id="maxRetry"
                  name="maxRetry"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.maxRetry}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Discord Webhook URL</Label>
              <Input
                id="webhookUrl"
                name="webhookUrl"
                type="url"
                value={formData.webhookUrl}
                onChange={handleChange}
                placeholder="https://discord.com/api/webhooks/..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value || 'active' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payloadJson">Discord JSON Payload</Label>
              <Textarea
                id="payloadJson"
                name="payloadJson"
                value={formData.payloadJson}
                onChange={handleChange}
                placeholder='{"content": "Hello Discord!"}'
                className="font-mono h-48"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push('/tasks')}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
