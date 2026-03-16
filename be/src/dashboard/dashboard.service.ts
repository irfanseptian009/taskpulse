import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';

/**
 * Dashboard service providing aggregated metrics.
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
  ) {}

  /**
   * Get dashboard summary with task counts.
   */
  async getSummary() {
    const [totalTasks, activeTasks, failedTasks] = await Promise.all([
      this.prisma.task.count(),
      this.prisma.task.count({ where: { status: 'active' } }),
      this.logsService.countFailedTasks(),
    ]);

    return {
      total_tasks: totalTasks,
      active_tasks: activeTasks,
      failed_tasks: failedTasks,
    };
  }
}
