import { Injectable, Logger } from '@nestjs/common';
import { TaskLog, LogStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for managing task execution logs.
 */
@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new execution log entry.
   */
  async createLog(data: {
    taskId: string;
    status: LogStatus;
    retryCount: number;
    message?: string;
  }): Promise<TaskLog> {
    this.logger.log(
      `Logging execution for task ${data.taskId}: ${data.status} (retry: ${data.retryCount})`,
    );
    return this.prisma.taskLog.create({
      data: {
        taskId: data.taskId,
        executionTime: new Date(),
        status: data.status,
        retryCount: data.retryCount,
        message: data.message ?? null,
      },
    });
  }

  /**
   * Get all logs for a specific task, ordered by execution time descending.
   */
  async findByTaskId(taskId: string): Promise<TaskLog[]> {
    return this.prisma.taskLog.findMany({
      where: { taskId },
      orderBy: { executionTime: 'desc' },
    });
  }

  /**
   * Count failed task logs (for dashboard metrics).
   */
  async countFailed(): Promise<number> {
    return this.prisma.taskLog.count({
      where: { status: 'failed' },
    });
  }

  /**
   * Count distinct tasks that have at least one failed log.
   */
  async countFailedTasks(): Promise<number> {
    const result = await this.prisma.taskLog.findMany({
      where: { status: 'failed' },
      distinct: ['taskId'],
      select: { taskId: true },
    });
    return result.length;
  }
}
