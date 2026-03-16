import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';
import { TaskStatus } from '@prisma/client';

/**
 * DTO for creating a new task.
 */
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  schedule: string;

  @IsString()
  @IsNotEmpty()
  webhookUrl: string;

  @IsObject()
  payloadJson: Record<string, any>;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxRetry?: number = 3;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus = TaskStatus.active;
}

/**
 * DTO for updating an existing task.
 * All fields are optional.
 */
export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @IsObject()
  @IsOptional()
  payloadJson?: Record<string, any>;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxRetry?: number;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
