import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Task, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';

/**
 * Service handling CRUD operations for scheduled tasks.
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new scheduled task.
   */
  async create(dto: CreateTaskDto): Promise<Task> {
    this.logger.log(`Creating task: ${dto.name}`);
    return this.prisma.task.create({
      data: {
        name: dto.name,
        schedule: dto.schedule,
        webhookUrl: dto.webhookUrl,
        payloadJson: dto.payloadJson as Prisma.InputJsonValue,
        maxRetry: dto.maxRetry ?? 3,
        status: dto.status ?? 'active',
      },
    });
  }

  /**
   * Retrieve all tasks, ordered by creation date descending.
   */
  async findAll(): Promise<Task[]> {
    return this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieve a single task by ID.
   * @throws NotFoundException if task doesn't exist.
   */
  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  /**
   * Update an existing task.
   * @throws NotFoundException if task doesn't exist.
   */
  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.findOne(id); // Ensure task exists
    this.logger.log(`Updating task: ${id}`);

    const data: Prisma.TaskUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.schedule !== undefined) data.schedule = dto.schedule;
    if (dto.webhookUrl !== undefined) data.webhookUrl = dto.webhookUrl;
    if (dto.payloadJson !== undefined)
      data.payloadJson = dto.payloadJson as Prisma.InputJsonValue;
    if (dto.maxRetry !== undefined) data.maxRetry = dto.maxRetry;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.task.update({ where: { id }, data });
  }

  /**
   * Delete a task by ID.
   * @throws NotFoundException if task doesn't exist.
   */
  async remove(id: string): Promise<Task> {
    await this.findOne(id); // Ensure task exists
    this.logger.log(`Deleting task: ${id}`);
    return this.prisma.task.delete({ where: { id } });
  }

  /**
   * Get all active tasks (used by scheduler on startup).
   */
  async findActive(): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { status: 'active' },
    });
  }
}
