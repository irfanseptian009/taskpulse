import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { LogsModule } from '../logs/logs.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [LogsModule, AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
