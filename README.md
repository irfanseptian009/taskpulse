# TaskPulse

TaskPulse adalah platform full-stack untuk menjadwalkan pengiriman payload ke Discord Webhook menggunakan cron expression, dilengkapi autentikasi, dashboard, log eksekusi, pengaturan user, dan manajemen notifikasi.

## Ringkasan Arsitektur

- Frontend: Next.js App Router + React 19 + TypeScript
- Backend: NestJS + Prisma + PostgreSQL
- Scheduler: `node-cron` (registrasi job aktif saat startup)
- Delivery engine: Axios + retry exponential backoff
- Auth: Bearer token (`Authorization: Bearer <token>`)
- Storage avatar: Supabase Storage bucket `profile`

## Repository Structure

```text
taskpulse/
├── be/                 # NestJS backend API + scheduler
├── fe/                 # Next.js frontend app
├── .env.example        # Contoh env backend minimum
├── docker-compose.yml  # Compose file (perlu review path jika dipakai)
└── README.md
```

## Fitur Utama

- Auth: register, login, profile session (`/auth/me`), change password
- Tasks CRUD dengan validasi cron dan preview human-readable di FE
- Scheduler otomatis untuk task status `active`
- Retry webhook gagal dengan exponential backoff (`1s, 2s, 4s, ...`)
- Task execution logs per task
- Dashboard summary metrik task
- User profile/settings/notifications
- Upload avatar user ke Supabase Storage
- UI modern: sidebar collapse/hover, mode card/table, create/edit via modal

## Tech Stack Detail

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Base UI + shadcn-style component system
- TanStack Query
- Axios
- Recharts
- Sonner

### Backend
- NestJS 11
- Prisma 5
- PostgreSQL
- node-cron
- class-validator + class-transformer
- Supabase JS (storage upload)

## Quick Start (Recommended)

### 1) Backend

```bash
cd be
npm install
cp ../.env.example .env
```

Isi `.env` backend sesuai environment Anda (lihat detail di [be/README.md](be/README.md)).

Lanjutkan setup database:

```bash
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Backend default: `http://localhost:4000/api`

### 2) Frontend

```bash
cd fe
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000/api' > .env.local
npm run dev
```

Frontend default: `http://localhost:3000`

## Environment Variables (High-Level)

### Backend (`be/.env`)

| Variable | Required | Keterangan |
|---|---|---|
| `DATABASE_URL` | Yes | Koneksi utama PostgreSQL (Prisma) |
| `DIRECT_URL` | Yes | Koneksi direct untuk migrasi Prisma |
| `JWT_SECRET` | Yes | Secret signing token auth |
| `PORT` | No | Default `4000` |
| `DISCORD_TIMEOUT` | No | Timeout webhook dalam ms, default `10000` |
| `SUPABASE_URL` | Optional | Wajib jika fitur upload avatar diaktifkan |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Wajib jika fitur upload avatar diaktifkan |

### Frontend (`fe/.env.local`)

| Variable | Required | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL backend API |

## Security Notes

- Seluruh endpoint selain auth publik diproteksi guard bearer token.
- Simpan kredensial `.env` di secret manager, **jangan commit ke git**.
- Jika ada secret/keys yang sempat terekspos, lakukan rotasi key segera.

## Testing

Backend:

```bash
cd be
npm run test
npm run test:cov
```

Frontend lint:

```bash
cd fe
npm run lint
```

## Deployment Notes

- FE siap untuk deployment Next.js (contoh Netlify/Vercel).
- BE dapat deploy ke Railway (lihat [be/railway.json](be/railway.json)).
- Untuk production:
	- gunakan `prisma migrate deploy`
	- aktifkan TLS DB
	- gunakan secret manager
	- harden CORS origin

## Dokumentasi Modul

- Backend detail: [be/README.md](be/README.md)
- Frontend detail: [fe/README.md](fe/README.md)
