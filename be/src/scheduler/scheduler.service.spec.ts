import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { TasksService } from '../tasks/tasks.service';
import { LogsService } from '../logs/logs.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * Unit tests for SchedulerService – execution logic, retry mechanism,
 * and Discord webhook handling.
 */
describe('SchedulerService', () => {
  let service: SchedulerService;

  const mockTask = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Task',
    schedule: '*/5 * * * *',
    webhookUrl: 'https://discord.com/api/webhooks/test/token',
    payloadJson: {
      content: 'Test message',
      username: 'Task Bot',
    },
    maxRetry: 2,
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasksService = {
    findActive: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(mockTask),
  };

  const mockLogsService = {
    createLog: jest.fn().mockResolvedValue({}),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(5000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: TasksService, useValue: mockTasksService },
        { provide: LogsService, useValue: mockLogsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);

    jest.clearAllMocks();

    // Speed up tests by mocking sleep
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerJob', () => {
    it('should register a valid cron job', () => {
      service.registerJob(mockTask);
      expect(service.getJobCount()).toBe(1);
    });

    it('should not register an invalid cron expression', () => {
      const invalidTask = { ...mockTask, schedule: 'invalid-cron' };
      service.registerJob(invalidTask);
      expect(service.getJobCount()).toBe(0);
    });

    it('should replace existing job for the same task', () => {
      service.registerJob(mockTask);
      service.registerJob(mockTask);
      expect(service.getJobCount()).toBe(1);
    });
  });

  describe('removeJob', () => {
    it('should remove a registered job', () => {
      service.registerJob(mockTask);
      expect(service.getJobCount()).toBe(1);

      service.removeJob(mockTask.id);
      expect(service.getJobCount()).toBe(0);
    });

    it('should handle removing a non-existent job gracefully', () => {
      expect(() => service.removeJob('non-existent')).not.toThrow();
    });
  });

  describe('executeTask', () => {
    it('should execute task successfully on first attempt', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 204, data: null });

      await service.executeTask(mockTask);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockTask.webhookUrl,
        mockTask.payloadJson,
        expect.objectContaining({ timeout: 5000 }),
      );
      expect(mockLogsService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: mockTask.id,
          status: 'success',
          retryCount: 0,
        }),
      );
    });

    it('should retry on failure and succeed on second attempt', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ status: 204, data: null });

      await service.executeTask(mockTask);

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(mockLogsService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          retryCount: 1,
        }),
      );
    });

    it('should log failure after all retries exhausted', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Persistent failure'));

      await service.executeTask(mockTask);

      // maxRetry is 2, so total attempts = 3 (initial + 2 retries)
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
      expect(mockLogsService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          retryCount: 2,
          message: expect.stringContaining('Persistent failure'),
        }),
      );
    });

    it('should skip execution if task is paused', async () => {
      const pausedTask = { ...mockTask, status: 'paused' as const };
      mockTasksService.findOne.mockResolvedValueOnce(pausedTask);

      await service.executeTask(pausedTask);

      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(mockLogsService.createLog).not.toHaveBeenCalled();
    });

    it('should remove job if task no longer exists', async () => {
      mockTasksService.findOne.mockRejectedValueOnce(new Error('Not found'));

      service.registerJob(mockTask);
      expect(service.getJobCount()).toBe(1);

      await service.executeTask(mockTask);

      expect(service.getJobCount()).toBe(0);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('onModuleInit', () => {
    it('should register jobs for all active tasks on startup', async () => {
      mockTasksService.findActive.mockResolvedValue([mockTask]);

      await service.onModuleInit();

      expect(mockTasksService.findActive).toHaveBeenCalled();
      expect(service.getJobCount()).toBe(1);
    });
  });
});
