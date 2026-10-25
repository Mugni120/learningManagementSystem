# LMS — Learning Management System

Aplikasi web manajemen course, student, dan assessment. Server-rendered MVC.

**Stack:** Node.js · Express 4 · EJS · MySQL (mysql2 pool) · express-session (MySQL store) · bcryptjs · helmet · compression · express-rate-limit

## Struktur folder

```
config/        koneksi MySQL (pool)
controllers/   logic per fitur (auth, course, learn, assignment, quiz, admin)
middleware/    auth (requireLogin/requireGuest/requireRole) + error handler
models/        query SQL per tabel/relasi
routes/        mapping URL -> controller, plus guard role
views/         template EJS (partials, instructor/, learn/, assignments/, quizzes/)
public/        css/style.css, js/app.js
database/      schema.sql (DDL + seed)
server.js      bootstrap app: security, session, router, shutdown
```

## Menjalankan lokal

1. Nyalakan MySQL (XAMPP atau service lain) dan import schema sekali saja:
   `mysql -u root < database/schema.sql`
2. Salin env lalu sesuaikan: `cp .env.example .env`
3. `npm install`
4. `npm run dev` (auto-reload) atau `npm start`
5. Buka http://localhost:3000

Akun demo: `admin@lms.test / Admin123!`, `instructor@lms.test / Instructor123!`, `student@lms.test / Student123!`.

## Environment variables

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` mengaktifkan secure cookie, view cache, static cache 7 hari |
| `PORT` | `3000` | port app |
| `SESSION_SECRET` | — | wajib string acak panjang, ganti di production |
| `DB_HOST/DB_USER/DB_PASS/DB_NAME` | localhost/root/(kosong)/lms_db | koneksi MySQL |
| `DB_POOL_LIMIT` | `10` | ukuran connection pool |
| `TRUST_PROXY_HOPS` | `1` | jumlah reverse proxy di depan app (agar IP client benar untuk rate limit) |

Tabel `sessions` dibuat otomatis oleh `express-mysql-session` saat app pertama jalan.

## Deploy

### Docker Compose (app + MySQL)

```bash
docker compose up -d --build       # schema.sql auto-import saat volume db kosong
docker compose logs -f app
```

Ganti `SESSION_SECRET` dan `MYSQL_ROOT_PASSWORD` di `docker-compose.yml` (atau pakai secret manager) sebelum publish.

### PM2 di VPS

```bash
npm ci --omit=dev
NODE_ENV=production pm2 start server.js -i max --name lms
pm2 save && pm2 startup
```

Di belakang Nginx/Caddy: set `TRUST_PROXY_HOPS=1`, terapkan HTTPS (cookie `secure` hanya dikirim lewat TLS), dan `proxy_pass` ke `127.0.0.1:3000`.

### Verifikasi setelah deploy

- `curl -i http://<host>/healthz` → `{"status":"ok"}` (503 jika DB tidak terjangkau)
- `curl -I http://<host>/login` → header `content-security-policy`, `strict-transport-security`, `x-content-type-options` ada
- Login 11x gagal berturut-turut → `429 Too Many Requests`

## Optimasi & keamanan yang sudah diterapkan

- **helmet**: CSP (hanya script `'self'`, karena `public/js/app.js` dipakai alih-alih inline script), HSTS, frame-ancestors, no-sniff
- **compression**: gzip HTML/CSS/JS
- **Cache static**: `max-age=7d` + ETag saat `NODE_ENV=production`
- **Session di MySQL**: login tidak hilang saat restart app dan bisa dipakai multi-instance
- **Rate limit**: 10 percobaan / 15 menit untuk `POST /login` dan `/register` (request sukses tidak dihitung)
- **Body limit** `express.urlencoded` 100kb, `x-powered-by` dimatikan, cookie `httpOnly` + `sameSite=lax` + `secure` di production
- **Graceful shutdown** (`SIGTERM`/`SIGINT`): menutup HTTP server lalu pool MySQL
- **Index DB** di `schema.sql`: `courses(status, instructor_id)`, `modules(course_id, position)`, `enrollments(course_id, student_id)`, `lesson_progress(enrollment_id, lesson_id)`, `quiz_attempts(quiz_id, student_id)`, `submissions(assignment_id, submitted_at)`
  Untuk DB lama yang sudah terisi, tambahkan manual: `ALTER TABLE submissions ADD INDEX idx_submissions_assignment_submitted (assignment_id, submitted_at);`
- **Query agregasi** memakai subquery count per tabel induk agar list page tidak perlu N+1 query

## Checklist bila traffic naik

- Pindah static asset ke CDN dan set `immutable`
- `DB_POOL_LIMIT` disamakan dengan `(worker PM2 x ukuran pool)` agar tidak melebihi `max_connections` MySQL
- Backup DB terjadwal (`mysqldump lms_db`) dan uji restore
