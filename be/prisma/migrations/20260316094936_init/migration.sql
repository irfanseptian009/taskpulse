-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('active', 'paused');

-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('success', 'failed');

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "webhook_url" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "max_retry" INTEGER NOT NULL DEFAULT 3,
    "status" "TaskStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_logs" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "execution_time" TIMESTAMP(3) NOT NULL,
    "status" "LogStatus" NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "task_logs" ADD CONSTRAINT "task_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
