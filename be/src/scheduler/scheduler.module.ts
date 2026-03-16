import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { TasksModule } from '../tasks/tasks.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [TasksModule, LogsModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
