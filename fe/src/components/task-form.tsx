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

type TaskFormProps = {
  taskId?: string;
  mode?: 'page' | 'modal';
  onCancel?: () => void;
  onSuccess?: () => void;
};

export default function TaskForm({ taskId, mode = 'page', onCancel, onSuccess }: TaskFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!taskId;
  const isModal = mode === 'modal';

  const [cronPreview, setCronPreview] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'preset' | 'manual'>('preset');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('');
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

  const CRON_PRESETS = [
    { key: 'every_5_min', label: 'Every 5 minutes', value: '*/5 * * * *' },
    { key: 'every_15_min', label: 'Every 15 minutes', value: '*/15 * * * *' },
    { key: 'every_hour', label: 'Every hour', value: '0 * * * *' },
    { key: 'daily_07', label: 'Every day at 07:00', value: '0 7 * * *' },
    { key: 'daily_09', label: 'Every day at 09:00', value: '0 9 * * *' },
    { key: 'weekly_mon_09', label: 'Every Monday at 09:00', value: '0 9 * * 1' },
    { key: 'monthly_day1_08', label: '1st day every month at 08:00', value: '0 8 1 * *' },
  ];

  const DEFAULT_PRESET = CRON_PRESETS[0];

  const normalizeCronExpression = (value: string): string =>
    value
      .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  useEffect(() => {
    if (!task) return;

    const normalizedSchedule = normalizeCronExpression(task.schedule);
    const matchedPreset = CRON_PRESETS.find(
      (preset) => preset.value === normalizedSchedule,
    );

    setFormData({
      name: task.name,
      schedule: normalizedSchedule,
      webhookUrl: task.webhookUrl,
      payloadJson: JSON.stringify(task.payloadJson, null, 2),
      maxRetry: task.maxRetry,
      status: task.status,
    });

    if (matchedPreset) {
      setScheduleMode('preset');
      setSelectedPresetKey(matchedPreset.key);
    } else {
      setScheduleMode('manual');
      setSelectedPresetKey('');
    }
  }, [task]);

  useEffect(() => {
    if (isEditing || scheduleMode !== 'preset' || selectedPresetKey) return;

    setSelectedPresetKey(DEFAULT_PRESET.key);
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule || DEFAULT_PRESET.value,
    }));
  }, [DEFAULT_PRESET.key, DEFAULT_PRESET.value, isEditing, scheduleMode, selectedPresetKey]);

  useEffect(() => {
    try {
      const normalized = normalizeCronExpression(formData.schedule);

      if (normalized) {
        setCronPreview(
          cronstrue.toString(normalized, { throwExceptionOnParseError: true }),
        );
      } else {
        setCronPreview('');
      }
    } catch {
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
        schedule: normalizeCronExpression(data.schedule),
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

      if (onSuccess) {
        onSuccess();
        return;
      }

      if (!isModal) {
        router.push('/tasks');
      }
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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    router.push('/tasks');
  };

  const formCard = (
    <form onSubmit={handleSubmit}>
      <Card>
        {!isModal && (
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>All fields are required unless marked otherwise.</CardDescription>
          </CardHeader>
        )}
        <CardContent className={`space-y-6 ${isModal ? 'pt-6' : ''}`}>
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
              <Select
                value={scheduleMode}
                onValueChange={(value) => {
                  const nextMode = value as 'preset' | 'manual';

                  setScheduleMode(nextMode);

                  if (nextMode === 'preset') {
                    const fallbackPreset =
                      CRON_PRESETS.find((preset) => preset.key === selectedPresetKey) ?? DEFAULT_PRESET;

                    setSelectedPresetKey(fallbackPreset.key);
                    setFormData((prev) => ({
                      ...prev,
                      schedule: fallbackPreset.value,
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preset">Use ready schedule</SelectItem>
                  <SelectItem value="manual">Write manually</SelectItem>
                </SelectContent>
              </Select>

              {scheduleMode === 'preset' ? (
                <Select
                  value={selectedPresetKey}
                  onValueChange={(presetKey) => {
                    const selectedPreset = CRON_PRESETS.find(
                      (preset) => preset.key === presetKey,
                    );

                    if (!selectedPreset) return;

                    setSelectedPresetKey(selectedPreset.key);
                    setFormData((prev) => ({
                      ...prev,
                      schedule: selectedPreset.value,
                    }));
                  }}
                >
                  <SelectTrigger id="schedule">
                    <SelectValue placeholder="Choose cron preset" />
                  </SelectTrigger>
                  <SelectContent className="z-120">
                    {CRON_PRESETS.map((preset) => (
                      <SelectItem key={preset.key} value={preset.key}>
                        {preset.label} ({preset.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="schedule"
                  name="schedule"
                  value={formData.schedule}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      schedule: normalizeCronExpression(event.target.value),
                    }))
                  }
                  placeholder="*/5 * * * *"
                  required
                />
              )}

              <p className="text-xs text-muted-foreground h-4">
                {cronPreview ? (
                  <span
                    className={
                      cronPreview === 'Invalid cron expression'
                        ? 'text-destructive'
                        : 'text-primary'
                    }
                  >
                    {cronPreview}
                  </span>
                ) : (
                  ' ' 
                )}
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
          <Button variant="outline" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );

  if (isModal) {
    return formCard;
  }

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

      {formCard}
    </div>
  );
}
