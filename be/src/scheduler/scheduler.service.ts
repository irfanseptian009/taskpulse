import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cron from 'node-cron';
import axios from 'axios';
import { Task } from '@prisma/client';
import { TasksService } from '../tasks/tasks.service';
import { LogsService } from '../logs';

/**
 * Scheduler engine that manages cron jobs for all active tasks.
 * Registers jobs on startup and provides methods to add/remove jobs dynamically.
 */
@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly jobs = new Map<string, cron.ScheduledTask>();
  private readonly jobSchedules = new Map<string, string>();
  private readonly discordTimeout: number;
  private readonly syncIntervalMs: number;
  private syncTimer?: NodeJS.Timeout;

  constructor(
    private readonly tasksService: TasksService,
    private readonly logsService: LogsService,
    private readonly configService: ConfigService,
  ) {
    this.discordTimeout = this.configService.get<number>('DISCORD_TIMEOUT') || 10000;
    this.syncIntervalMs = this.configService.get<number>('SCHEDULER_SYNC_INTERVAL') || 30000;
  }

  /**
   * On module init, register cron jobs for all active tasks.
   */
  async onModuleInit() {
    this.logger.log('Initializing scheduler engine...');
    try {
      await this.syncJobsWithDatabase();

      this.syncTimer = setInterval(() => {
        void this.syncJobsWithDatabase();
      }, this.syncIntervalMs);

      this.logger.log('Scheduler engine initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize scheduler', error);
    }
  }

  /**
   * On module destroy, stop all running cron jobs.
   */
  onModuleDestroy() {
    this.logger.log('Shutting down scheduler engine...');

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }

    for (const [taskId, job] of this.jobs) {
      job.stop();
      this.logger.log(`Stopped job for task: ${taskId}`);
    }
    this.jobs.clear();
    this.jobSchedules.clear();
  }

  /**
   * Register a cron job for a given task.
   */
  registerJob(task: Task): void {
    // Stop existing job if it exists
    this.removeJob(task.id);

    if (!cron.validate(task.schedule)) {
      this.logger.error(`Invalid cron expression for task ${task.id}: ${task.schedule}`);
      return;
    }

    const job = cron.schedule(task.schedule, async () => {
      await this.executeTask(task);
    });

    this.jobs.set(task.id, job);
    this.jobSchedules.set(task.id, task.schedule);
    this.logger.log(`Registered cron job for task "${task.name}" [${task.schedule}]`);
  }

  /**
   * Remove and stop a cron job for a given task ID.
   */
  removeJob(taskId: string): void {
    const existingJob = this.jobs.get(taskId);
    if (existingJob) {
      existingJob.stop();
      this.jobs.delete(taskId);
      this.jobSchedules.delete(taskId);
      this.logger.log(`Removed cron job for task: ${taskId}`);
    }
  }

  /**
   * Sync scheduler jobs with active tasks in database so runtime CRUD changes
   * (create/update/delete/pause) are reflected without restarting the backend.
   */
  private async syncJobsWithDatabase(): Promise<void> {
    const activeTasks = await this.tasksService.findActive();
    this.logger.log(`Found ${activeTasks.length} active task(s) to schedule`);

    const activeTaskIds = new Set(activeTasks.map((task) => task.id));

    // Register missing jobs and refresh jobs with updated schedule
    for (const task of activeTasks) {
      const currentJob = this.jobs.get(task.id);
      const currentSchedule = this.jobSchedules.get(task.id);

      if (!currentJob || currentSchedule !== task.schedule) {
        this.registerJob(task);
      }
    }

    // Remove jobs for tasks that are no longer active/existing
    for (const taskId of this.jobs.keys()) {
      if (!activeTaskIds.has(taskId)) {
        this.removeJob(taskId);
      }
    }
  }

  /**
   * Execute a task: send Discord webhook with retry logic.
   */
  async executeTask(task: Task): Promise<void> {
    this.logger.log(`Executing task: "${task.name}" (${task.id})`);

    // Re-fetch task to get latest data
    let currentTask: Task;
    try {
      currentTask = await this.tasksService.findOne(task.id);
    } catch {
      this.logger.warn(`Task ${task.id} no longer exists, removing job`);
      this.removeJob(task.id);
      return;
    }

    // Skip if task is paused
    if (currentTask.status === 'paused') {
      this.logger.log(`Task "${currentTask.name}" is paused, skipping execution`);
      return;
    }

    const maxRetries = currentTask.maxRetry;
    let lastError: string | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.sendWebhook(currentTask.webhookUrl, currentTask.payloadJson);

        // Success – log it
        await this.logsService.createLog({
          taskId: currentTask.id,
          status: 'success',
          retryCount: attempt,
          message: `Task executed successfully${attempt > 0 ? ` after ${attempt} retries` : ''}`,
        });

        this.logger.log(`Task "${currentTask.name}" executed successfully (attempt ${attempt + 1})`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Task "${currentTask.name}" attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError}`,
        );

        // Wait before retrying (exponential backoff: 1s, 2s, 4s...)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted – log failure
    await this.logsService.createLog({
      taskId: currentTask.id,
      status: 'failed',
      retryCount: maxRetries,
      message: `Task failed after ${maxRetries + 1} attempts. Last error: ${lastError}`,
    });

    this.logger.error(`Task "${currentTask.name}" failed after all retries`);
  }

  /**
   * Send an HTTP POST request to the Discord webhook URL.
   */
  private async sendWebhook(webhookUrl: string, payload: any): Promise<void> {
    await axios.post(webhookUrl, payload, {
      timeout: this.discordTimeout,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Utility to sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the count of currently registered jobs.
   */
  getJobCount(): number {
    return this.jobs.size;
  }
}
