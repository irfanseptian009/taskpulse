import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [LogsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
