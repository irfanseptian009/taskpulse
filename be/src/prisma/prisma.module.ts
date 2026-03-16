import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global Prisma module – provides PrismaService to all modules
 * without requiring explicit imports.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
