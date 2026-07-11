# Dokumentasi Alur & Arsitektur Backend TaskPulse

Dokumen ini menjelaskan alur kerja, arsitektur, dan algoritma yang digunakan di backend **TaskPulse** (yang dibangun menggunakan **NestJS**, **Prisma ORM**, dan **node-cron**).

---

## 1. Authentication (Auth)

### Apa itu Authentication (Auth)?
Authentication (Autentikasi) adalah proses memverifikasi identitas pengguna (apakah ia benar-benar orang yang ia klaim). Di dalam aplikasi, ini adalah "pintu masuk" yang memastikan hanya orang yang memiliki kredensial sah (seperti email dan password) yang bisa mengakses fitur tertentu, seperti membuat tugas atau melihat dashboard.

### Fungsi Auth di TaskPulse
- **Keamanan Akses**: Melindungi endpoint API agar hanya bisa diakses oleh pengguna terdaftar.
- **Identifikasi Pengguna**: Mengetahui siapa yang sedang mengakses sistem.
- **Sesi Pengguna**: Memberikan token kepada pengguna agar mereka tidak perlu terus-menerus memberikan password setiap kali memanggil API.

### Algoritma & Alur Auth TaskPulse
Di sistem ini, penyimpanan data pengguna (`User`) memanfaatkan file JSON (`data/auth-users.json`) secara kustom, sementara autentikasi menggunakan algoritma kriptografi asli bawaan Node.js (`crypto`).

1. **Registrasi (Register)**
   - Saat pengguna mendaftar, backend akan membaca file `auth-users.json` untuk mengecek apakah email sudah dipakai.
   - **Hashing Password**: Password pengguna tidak disimpan dalam bentuk teks biasa (plaintext). Backend menggunakan algoritma **`scryptSync`** dengan `salt` (data acak berukuran 16 byte yang dibuat oleh `randomBytes`).
   - Format penyimpanan password hash di file adalah `salt:hash`.
   - Backend membuang (generate) **JWT (JSON Web Token)** secara manual dan memberikannya ke klien.

2. **Login**
   - Backend mencari pengguna berdasarkan email dari `auth-users.json`.
   - Backend mengekstrak `salt` dari database, lalu menghitung kembali hash dari password yang dimasukkan saat login menggunakan fungsi `scryptSync`.
   - **Verifikasi**: Backend menggunakan `timingSafeEqual` (untuk mencegah serangan _timing attack_) untuk membandingkan password yang diinput dengan yang ada di database.
   - Jika cocok, token JWT (kustom) dibuat dan dikirim ke klien.

3. **JSON Web Token (JWT) Kustom**
   - Token ditandatangani menggunakan algoritma **HMAC SHA-256** dan secret key (diambil dari `.env` atau default).
   - Token terdiri dari Payload (data user & masa kedaluwarsa) dan Signature (tanda tangan digital) dalam format `Base64Url`.

---

## 2. Tasks Management (Manajemen Tugas)

Modul ini bertanggung jawab untuk operasi CRUD (Create, Read, Update, Delete) terkait tugas, menggunakan **Prisma ORM** yang dihubungkan ke Database (misalnya PostgreSQL atau SQLite).

### Alur Kerja:
1. **Create Task**: Pengguna (melalui antarmuka) membuat tugas baru dengan jadwal (format cron) dan URL Webhook Discord beserta Payload JSON.
2. **Database Saving**: `TasksService` menyimpan konfigurasi tugas ini ke dalam database menggunakan `prisma.task.create`.
3. **Database Structuring**: Tabel Task berisi informasi vital untuk Scheduler, antara lain: `schedule`, `webhookUrl`, `payloadJson`, nilai `maxRetry`, dan `status` ("active" atau "paused").
4. **Update/Delete**: Bekerja seperti biasa, namun setiap kali `status` atau `schedule` diubah, ini akan langsung memengaruhi modul **Scheduler**.

---

## 3. Scheduler Engine (Mesin Penjadwalan)

Ini merupakan jantung (core engine) dari TaskPulse yang bertugas mengeksekusi tugas secara otomatis di latar belakang (background) sesuai dengan jadwal yang telah ditentukan.

### Teknologi
Menggunakan library **`node-cron`** untuk mengeksekusi cron jobs.

### Alur Kerja & Algoritma Penjadwalan:
1. **Inisialisasi & Sinkronisasi (Sync)**
   - Saat server backend dijalankan (`OnModuleInit`), `SchedulerService` akan mengambil seluruh tugas dengan `status: 'active'` dari database (`TasksService`).
   - Jadwal dievaluasi dan diubah menjadi *Cron Job* nyata menggunakan `cron.schedule()`.
   - Terdapat **Interval Sinkronisasi** (default 30 detik) di mana scheduler rutin melakukan pengecekan ulang (sync) ke database:
     - Jika ada tugas baru, cron job akan dibuat.
     - Jika jadwal tugas berubah, job lama dihentikan dan job baru dibuat (On-the-fly Update).
     - Jika tugas dihapus atau status menjadi 'paused', job terkait akan dihentikan & dihapus dari memori (RAM).

2. **Eksekusi Tugas (Task Execution)**
   - Saat waktu cron tiba, scheduler akan memicu fungsi `executeTask()`.
   - Sistem akan menarik data terbaru dari tugas tersebut melalui database untuk memastikan tugas tersebut belum dihapus atau di-*pause* sebelum detik eksekusi.
   - **HTTP Webhook**: Menggunakan **Axios**, sistem mengirim _POST request_ (dengan webhook payload URL dan JSON yang sudah dikonfigurasi) ke Discord.

3. **Algoritma Auto-Retry (Exponential Backoff)**
   - Jika terjadi kegagalan (misal Discord timeout/down), scheduler memiliki mekanisme *retry* cerdas.
   - Algoritma: Menggunakan pola **Exponential Backoff**: `Delay = 2^attempt * 1000` ms.
   - Contoh dengan Max Retry 3 kali: 
     - Gagal pertama -> Tunggu 1 detik -> Coba Lagi.
     - Gagal kedua -> Tunggu 2 detik -> Coba Lagi.
     - Gagal ketiga -> Tunggu 4 detik -> Coba Lagi.
   - Ini mencegah sistem me-request terus menerus saat API Discord tumbang (menghindari error rate-limit).

### 4. Logging
Setiap eksekusi Job yang *Berhasil (Success)* maupun *Gagal Eksekusi Penuh (Failed)* direkam menggunakan `LogsService`. Ini yang ditampilkan kembali ke *Dashboard* aplikasi FE untuk dipantau oleh pengguna.

---
## Kesimpulan Flow Secara Keseluruhan
1. (Frontend) -> **Auth**: Register/Login, mendapatkan Token.
2. (Frontend) -> **Task**: Kirim Header Authorization, tambah/edit task webhook.
3. (Backend) -> **TasksService**: Simpan ke Prisma/DB.
4. (Backend) -> **SchedulerService**: Secara asinkron menyinkronkan memori dengan DB, menjadwalkan run otomatis.
5. (Backend) -> **Scheduler**: Saat waktunya tiba, mengirim webhook menggunakan axios ke **Discord**. Jika gagal, auto-retry _Exponential Backoff_. Setelah selesai, catat log hasil.
