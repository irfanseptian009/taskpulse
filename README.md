# TaskPulse – Discord Webhook Task Scheduler

TaskPulse is a full-stack web application that allows users to create, manage, and monitor scheduled tasks. Each task executes on a defined cron schedule and sends a payload to a Discord Webhook.

## Architecture & Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui, React Query, Axios.
- **Backend**: NestJS, TypeScript, node-cron.
- **Database**: PostgreSQL (Supabase), Prisma ORM.
- **Infrastructure**: Docker, Docker Compose.

### Architecture Features
- **Cron Engine**: Dynamic registration of jobs on startup using `node-cron`.
- **Retry Mechanism**: Exponential backoff strategy for failed webhook deliveries.
- **Security**: Global `x-api-key` header protection for all REST endpoints using NestJS Guards.
- **Logging**: Comprehensive database logging of all successes and failures per task.

## Database Schema (Prisma)
- **`tasks`**: Stores task definition, cron schedule, Discord webhook URL, and JSON payload.
- **`task_logs`**: Stores execution history, statuses (`success`/`failed`), retry counts, and error messages.

## API Endpoints (Protected via `x-api-key`)
- `POST /tasks` - Create task
- `GET /tasks` - List all tasks
- `GET /tasks/:id` - Get specific task
- `PUT /tasks/:id` - Edit task (name, schedule, payload, max retries, status)
- `DELETE /tasks/:id` - Delete task and its logs (cascade)
- `GET /tasks/:id/logs` - View execution history for a task
- `GET /dashboard` - Get overall metrics (total, active, failed)

---

## How to Run Locally (Development)

1. Clone and install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Set up environment config:
Configure your `.env` in `backend/` and `.env.local` in `frontend/` (see `.env.example`). Note the project is configured to use Supabase via connection pooling.

3. Run Prisma Migrations (Backend):
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

4. Start the Application:
```bash
# Terminal 1 - Start Backend (PORT 4000)
cd backend && npm run start:dev

# Terminal 2 - Start Frontend (PORT 3000)
cd frontend && npm run dev
```

---

## How to Run with Docker

The entire stack is containerized for production readiness using multi-stage builds.

1. Ensure Docker Desktop is running.
2. Build and start services:
```bash
docker-compose up --build -d
```
3. Access the dashboard: `http://localhost:3000`
4. Access the API: `http://localhost:4000/api`

*(Note: The docker-compose provisions a local PostgreSQL container automatically so you don't need a live Supabase connection for testing the docker flow).*

---

## How to Run Unit Tests

The backend includes comprehensive Jest test suites covering CRUD, Scheduler Engine execution/retries, and API Guards.

```bash
cd backend
npm run test
```
The test suite will mock Axios for safe Discord interactions.

---

## AI CLI Development Workflow

This project was built using AI CLI tools to accelerate development. Here are 3 examples of how AI was used:

### 1. Planning Database Schema
**Command:**
```bash
claude "Plan a Prisma schema for a task scheduler with webhook payloads and execution logs using UUIDs and enums."
```
**Output Outcome:**
Generated normalized `tasks` and `task_logs` models with a Cascade delete relation and proper database column mappings (`@map("snake_case")`). 

### 2. Generating Unit Tests for Retry Logic
**Command:**
```bash
gemini "Generate Jest unit tests for a SchedulerService that tests exponential backoff retry logic and mocks Axios POST requests."
```
**Output Outcome:**
Created `scheduler.service.spec.ts` testing successful webhook deliveries, failed deliveries tracking retry counts, and exhausted retry scenarios using `jest.mock('axios')`.

### 3. Planning API Endpoints
**Command:**
```bash
claude "Design RESTful API endpoints for the Discord task manager app and create a NestJS controller."
```
**Output Outcome:**
Generated standard CRUD endpoints, a `/tasks/:id/logs` relationship endpoint, and a dashboard summary endpoint protected by a custom `ApiKeyGuard` class.
