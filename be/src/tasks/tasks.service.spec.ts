import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

/**
 * Unit tests for TasksService CRUD operations.
 */
describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

  const mockTask = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Task',
    schedule: '*/5 * * * *',
    webhookUrl: 'https://discord.com/api/webhooks/test',
    payloadJson: { content: 'Hello!' },
    maxRetry: 3,
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.create({
        name: 'Test Task',
        schedule: '*/5 * * * *',
        webhookUrl: 'https://discord.com/api/webhooks/test',
        payloadJson: { content: 'Hello!' },
        maxRetry: 3,
        status: 'active',
      });

      expect(result).toEqual(mockTask);
      expect(mockPrismaService.task.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([mockTask]);

      const result = await service.findAll();

      expect(result).toEqual([mockTask]);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      const result = await service.findOne(mockTask.id);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updatedTask = { ...mockTask, name: 'Updated Task' };
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(mockTask.id, { name: 'Updated Task' });

      expect(result.name).toBe('Updated Task');
      expect(mockPrismaService.task.update).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      const result = await service.remove(mockTask.id);

      expect(result).toEqual(mockTask);
      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id: mockTask.id },
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findActive', () => {
    it('should return only active tasks', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([mockTask]);

      const result = await service.findActive();

      expect(result).toEqual([mockTask]);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });
  });
});
