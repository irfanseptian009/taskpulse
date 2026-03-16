import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

/**
 * Dashboard controller providing summary metrics.
 */
@Controller('dashboard')
@UseGuards(ApiKeyGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
