# TaskPulse Backend (NestJS)

Backend API untuk TaskPulse yang menangani autentikasi user, manajemen task cron, eksekusi webhook Discord, logging eksekusi, dashboard summary, serta profile/settings/notifications user.

## Tech Stack

- NestJS 11
- TypeScript 5
- Prisma ORM 5
- PostgreSQL
- node-cron
- Axios
- Supabase Storage (avatar upload)

## Arsitektur Modul

```text
src/
├── auth/        # register, login, me, change password, auth guard
├── tasks/       # CRUD task
├── logs/        # log eksekusi per task
├── dashboard/   # metrik summary
├── scheduler/   # in-memory cron scheduler + retry delivery
├── user/        # profile, settings, notifications, avatar upload
└── prisma/      # Prisma service/module
```

## Cara Menjalankan (Local)

### 1) Install dependency

```bash
npm install
```

### 2) Setup environment

Buat file `.env` di folder `be/`.

Contoh minimum:

```dotenv
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskpulse?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/taskpulse?schema=public"
JWT_SECRET="change-this-in-production"
PORT=4000
DISCORD_TIMEOUT=10000
```

Jika menggunakan avatar upload, tambahkan:

```dotenv
SUPABASE_URL="https://<your-project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

### 3) Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

### 4) Jalankan server

```bash
npm run start:dev
```

API base URL: `http://localhost:4000/api`

## NPM Scripts

| Script | Fungsi |
|---|---|
| `npm run start:dev` | Run dev (watch) |
| `npm run build` | Build production |
| `npm run start:prod` | Run hasil build |
| `npm run test` | Unit tests |
| `npm run test:cov` | Test coverage |
| `npm run lint` | Lint code |

## Authentication

- Endpoint publik: `POST /auth/register`, `POST /auth/login`
- Endpoint protected menggunakan `Authorization: Bearer <token>`
- Guard yang digunakan: `ApiKeyGuard` (nama historis, fungsi saat ini adalah bearer token guard)

## API Reference (Current)

Semua endpoint menggunakan prefix `/api`.

### Auth

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/auth/register` | No | Register user baru |
| POST | `/auth/login` | No | Login user |
| GET | `/auth/me` | Yes | Ambil profil auth user |
| PATCH | `/auth/password` | Yes | Ganti password |

### Tasks

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/tasks` | Yes | Buat task |
| GET | `/tasks` | Yes | List task |
| GET | `/tasks/:id` | Yes | Detail task |
| PUT | `/tasks/:id` | Yes | Update task |
| DELETE | `/tasks/:id` | Yes | Hapus task |
| GET | `/tasks/:id/logs` | Yes | Log eksekusi task |

### Dashboard

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/dashboard` | Yes | Summary total/active/failed tasks |

### User

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/user/profile` | Yes | Ambil profile |
| PATCH | `/user/profile` | Yes | Update profile |
| POST | `/user/profile/avatar` | Yes | Upload avatar (multipart `file`) |
| GET | `/user/settings` | Yes | Ambil settings |
| PATCH | `/user/settings` | Yes | Update settings |
| GET | `/user/notifications` | Yes | Ambil notifikasi |
| PATCH | `/user/notifications/:id/read` | Yes | Mark notification as read |

## Scheduler Behavior

- Saat aplikasi start, scheduler memuat semua task dengan status `active`.
- Setiap task dieksekusi sesuai cron expression.
- Saat gagal kirim webhook, sistem retry dengan exponential backoff.
- Semua hasil eksekusi disimpan ke `task_logs`.

## Data Persistence Notes

- Core task + logs disimpan di PostgreSQL (Prisma).
- Data auth dan user state saat ini berbasis file JSON pada folder `be/data/`:
  - `auth-users.json`
  - `user-state.json`

## CORS & Prefix

- CORS origin default:
  - `http://localhost:3000`
  - `http://frontend:3000`
- Global prefix: `/api`

## Deployment (Railway)

Konfigurasi Railway tersedia di [railway.json](railway.json):

- Build: `npm run build`
- Start: `npx prisma generate && npx prisma migrate deploy && npm run start:prod`

## Operasional & Security Checklist

- Gunakan `JWT_SECRET` panjang dan acak pada production.
- Gunakan env secret manager, bukan file plain text.
- Rotasi semua key yang pernah terekspos.
- Batasi CORS origin ke domain production.
- Aktifkan monitoring log untuk scheduler & webhook failures.
