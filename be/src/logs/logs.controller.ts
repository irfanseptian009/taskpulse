import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

/**
 * REST controller for task execution logs.
 */
@Controller('tasks')
@UseGuards(ApiKeyGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get(':id/logs')
  findByTaskId(@Param('id', ParseUUIDPipe) id: string) {
    return this.logsService.findByTaskId(id);
  }
}
