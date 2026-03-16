# TaskPulse Frontend (Next.js)

Frontend web app untuk TaskPulse yang menyediakan dashboard task scheduler, autentikasi user, task management, log viewer, profile/settings/notifications, serta upload avatar.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Base UI + shadcn-style components
- TanStack Query
- Axios
- Recharts
- Sonner

## Fitur UI

- Login & Register flow
- Route protection via middleware (redirect ke login jika belum auth)
- Dashboard metrik task dengan visual chart
- Task Management:
	- Create task via modal
	- Edit task via modal
	- View mode card/table
	- Cron preset/manual + cron preview
- Task logs viewer
- Profile page (termasuk upload avatar)
- Settings page
- Notifications page
- Responsive sidebar + header + dark/light theme

## Struktur Folder (Ringkas)

```text
src/
├── app/
│   ├── login/
│   ├── register/
│   ├── profile/
│   ├── settings/
│   ├── notifications/
│   ├── tasks/
│   └── page.tsx
├── components/
│   ├── layout/
│   ├── ui/
│   └── task-form.tsx
├── context/
├── lib/
│   ├── api.ts
│   ├── api-client.ts
│   └── auth.ts
├── types/
└── middleware.ts
```

## Menjalankan Lokal

### 1) Install

```bash
npm install
```

### 2) Environment

Buat file `.env.local` di folder `fe/`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3) Jalankan

```bash
npm run dev
```

App URL: `http://localhost:3000`

## NPM Scripts

| Script | Fungsi |
|---|---|
| `npm run dev` | Run local development |
| `npm run build` | Build production |
| `npm run start` | Start production build |
| `npm run lint` | Lint code |

## Integrasi API

Client API terpusat di [src/lib/api-client.ts](src/lib/api-client.ts):

- Inject bearer token ke header `Authorization`
- Auto-handle `401`:
	- hapus token local
	- redirect ke `/login`

Mapping endpoint API ada di [src/lib/api.ts](src/lib/api.ts):

- `authApi`
- `tasksApi`
- `dashboardApi`
- `userApi`

## Authentication Flow (Frontend)

- Token disimpan di:
	- `localStorage` (`taskpulse_token`)
	- cookie (`taskpulse_token`) untuk middleware check
- Middleware [src/middleware.ts](src/middleware.ts):
	- user tanpa token diarahkan ke `/login`
	- user bertoken tidak bisa akses `/login` atau `/register`

## UX Notes

- Task form mendukung 2 mode schedule:
	- `preset` (dropdown)
	- `manual` (input cron string)
- Create/Edit task menggunakan modal agar workflow lebih cepat.
- List task memiliki dua tampilan:
	- Card (visual)
	- Table (compact)

## Build & Deploy

- Next.js build standard:

```bash
npm run build
npm run start
```

- Netlify (monorepo) yang direkomendasikan:
	- Base directory: `fe`
	- Build command: `npm run build`
	- Publish directory: *(kosongkan / jangan diisi)*
	- Node version: `20`
- Konfigurasi tersedia di:
	- [../netlify.toml](../netlify.toml) (root monorepo)
	- [netlify.toml](netlify.toml) (jika source langsung ke folder fe)

## Troubleshooting Cepat

### Tidak bisa login / selalu redirect login
- Pastikan backend jalan di URL yang sama dengan `NEXT_PUBLIC_API_URL`
- Cek cookie `taskpulse_token`
- Cek response `401` di browser devtools

### Data tidak muncul
- Pastikan backend API base URL benar
- Cek network request ke endpoint `/api/*`

### Upload avatar gagal
- Cek backend env `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`
