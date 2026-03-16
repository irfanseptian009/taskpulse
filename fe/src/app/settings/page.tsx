'use client';

import { ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: userApi.getSettings,
  });

  const mutation = useMutation({
    mutationFn: userApi.updateSettings,
    onSuccess: () => {
      toast.success('Settings updated');
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    onError: () => toast.error('Failed to update settings'),
  });

  const handleCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
    mutation.mutate({ [event.target.name]: event.target.checked });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure app behavior and notification preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !settings ? (
            <p className="text-muted-foreground">Loading settings...</p>
          ) : (
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={settings.theme || 'system'} onValueChange={(theme) => mutation.mutate({ theme: theme as 'light' | 'dark' | 'system' })}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !settings ? (
            <p className="text-muted-foreground">Loading settings...</p>
          ) : (
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates by email.</p>
                </div>
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications ?? false}
                  onChange={handleCheckbox}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">In-App Notifications</p>
                  <p className="text-sm text-muted-foreground">Show alerts directly in dashboard.</p>
                </div>
                <input
                  type="checkbox"
                  name="inAppNotifications"
                  checked={settings.inAppNotifications ?? false}
                  onChange={handleCheckbox}
                />
              </label>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
