import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cron from 'node-cron';
import axios from 'axios';
import { Task } from '@prisma/client';
import { TasksService } from '../tasks/tasks.service';
import { LogsService } from '../logs/logs.service';

/**
 * Scheduler engine that manages cron jobs for all active tasks.
 * Registers jobs on startup and provides methods to add/remove jobs dynamically.
 */
@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly jobs = new Map<string, cron.ScheduledTask>();
  private readonly discordTimeout: number;

  constructor(
    private readonly tasksService: TasksService,
    private readonly logsService: LogsService,
    private readonly configService: ConfigService,
  ) {
    this.discordTimeout = this.configService.get<number>('DISCORD_TIMEOUT') || 10000;
  }

  /**
   * On module init, register cron jobs for all active tasks.
   */
  async onModuleInit() {
    this.logger.log('Initializing scheduler engine...');
    try {
      const activeTasks = await this.tasksService.findActive();
      this.logger.log(`Found ${activeTasks.length} active task(s) to schedule`);

      for (const task of activeTasks) {
        this.registerJob(task);
      }

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
    for (const [taskId, job] of this.jobs) {
      job.stop();
      this.logger.log(`Stopped job for task: ${taskId}`);
    }
    this.jobs.clear();
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
      this.logger.log(`Removed cron job for task: ${taskId}`);
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
