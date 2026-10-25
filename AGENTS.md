# AGENTS.md

Compact guidance for AI coding agents working in this repo. Verify before acting; executable sources win over prose.

## What this repo is

Single Express app (no monorepo). Server-rendered LMS: Node.js + Express 4 + EJS + MySQL (mysql2 pool) + express-session (MySQL store) + bcryptjs + helmet/compression/express-rate-limit. Vanilla JS frontend (`public/js/app.js`); no SPA framework.

Layering: `server.js` (bootstrap) → `routes/*Routes.js` → `controllers/*Controller.js` → `models/*Model.js` → `database/schema.sql`.

## Commands

- Requires MySQL running; import schema once: `mysql -u root < database/schema.sql` (creates + seeds `lms_db`).
- Optional seed: `node seed.js` adds 12 programming courses + modules + lessons for instructor_id=2 (script runs once, then delete).
- Optional performance indexes: `mysql -u root lms_db < database/indexes.sql`.
- `npm install` → `cp .env.example .env` (fill `SESSION_SECRET`; DB vars point at local MySQL).
- `npm run dev` = `node --watch server.js` (auto-reload) or `npm start` = `node server.js`. Listens on `PORT` (default 3000).
- **No lint / test / typecheck / build scripts exist** in `package.json`. No test suite; verify manually via dev server + `curl`.

## Key wiring facts

- All routers mounted at `/` in `server.js` order: auth, dashboard, instructor, catalog, admin, admin-categories, learn, assignment, quiz, profile; then `notFound`/`errorHandler`.
- Auth guards: `requireLogin`, `requireGuest`, `requireRole(...roles)` in `middleware/auth.js`.
- Session user shape: `{ id, full_name, email, role }` where `role` is role **name** string (`admin`, `instructor`, `student`).
- DB via mysql2 pool (`config/db.js`). Connection pool tuned with connectTimeout, charset utf8mb4, DECIMAL typeCast to number. Controllers call models directly (no service layer).
- EJS views in `views/`, partials in `views/partials/` (`header.ejs`, `footer.ejs`). Header renders navbar based on `currentUser` (from `res.locals` in `server.js`).

## Route behavior rules

- **Admin dashboard is at `/dashboard`** (single dashboard for admin). `/admin` is no longer a standalone page — only sub-routes exist (`/admin/users`, `/admin/courses`, `/admin/categories`). Nav link "Admin" points to `/dashboard`.
- **Quiz `max_attempts`** enforced — when exhausted, redirect to `/quizzes/:id/result`.
- **Certificate** (`/learn/:courseId/certificate`) only accessible when student progress is 100%.
- `quizController.index` needs `?course=X`; if missing → redirect to `/instructor/courses`.
- `userModel.findById()` **does not** select `password_hash` — use `findByEmail()` for bcrypt compare.

## Fitur per peran

| Peran | Fitur |
|-------|-------|
| **Student** | Katalog course (12+ course pemrograman), enroll, belajar (course player + timer), assignment (kumpulkan), quiz (timer + animasi + lihat hasil), profile (edit + ubah password), sertifikat (saat progress 100%) |
| **Instruktur** | Kelola course (CRUD, publish/unpublish), modul, lesson, quiz (buat + lihat hasil + animasi), assignment (buat + lihat submissions + nilai), peserta course (lihat daftar enroll + progress), 12+ course starter |
| **Admin** | Dashboard statistik, kelola user (role + aktif/nonaktif + hapus), kelola course, kelola kategori (CRUD) |

## Route & file baru (fitur tambahan)

- `controllers/profileController.js` + `routes/profileRoutes.js`: `GET/POST /profile`, `GET/POST /profile/password`
- `controllers/adminCategoryController.js` + `routes/adminCategoryRoutes.js`: `GET/POST /admin/categories`, `GET/POST /admin/categories/:id`, `POST /admin/categories/:id/delete`
- `controllers/adminController.js` + method `destroyUser`: `POST /admin/users/:id/delete`
- `controllers/instructorController.js` + method `enrollments`: `GET /instructor/courses/:id/enrollments`
- `controllers/learnController.js` + method `certificate`: `GET /learn/:courseId/certificate`
- `controllers/quizController.js`: quiz take dengan timer countdown + animasi; result dengan score card visual
- `views/profile/edit.ejs`, `views/profile/password.ejs`
- `views/admin/categories.ejs`, `views/admin/category-form.ejs`, `views/admin/users.ejs` (with delete)
- `views/instructor/enrollments.ejs`
- `views/instructor/courses/index.ejs` (card view)
- `views/quizzes/take.ejs` (timer + animasi pilihan)
- `views/quizzes/result.ejs` (score card + pembahasan jawaban)
- `views/quizzes/show.ejs` (instructor quiz management dengan animasi)
- `views/courses/index.ejs` (hero + course card)
- `views/dashboard/home.ejs` (hero + stat cards + progress)
- `utils/cache.js`: in-memory TTL cache (default 30s) untuk `published:catalog` dan `published:tree:<slug>`, di-flush saat course berubah.
- `database/seed_courses.sql`: 12 course pemrograman + modul + lesson
- `database/indexes.sql`: indeks performa untuk tabel yang sering diakses
- Quiz ter-seed per course (created via direct SQL INSERT, not in seed_courses.sql): C1 Express (Quiz 1, 2Q), C2 React (Quiz 4, 5Q), C4 Next.js (Quiz 5, 4Q), C5 Python (Quiz 6, 3Q), C6 ML Scikit (Quiz 7, 3Q), C7 React Native (Quiz 8, 2Q), C8 Flutter (Quiz 9, 2Q), C9 Figma (Quiz 10, 2Q), C10 Docker/K8s (Quiz 11, 2Q), C11 AWS (Quiz 12, 2Q), C12 Unity (Quiz 13, 2Q), C13 Cybersecurity (Quiz 14, 2Q). Quiz sempat ada (id=2, course 13, "FrontEnd", 0Q) → di-delete. Quiz take/submit memakai `time_limit_minutes`, `passing_score`, `max_attempts` dari quizzes.

## Quiz & learning content

- Setiap course (1,2,4-13) sudah punya >= 1 quiz dengan pertanyaan relevan (multiple_choice / true_false + options).
- Semua lesson (modules M2-M45, course 2-13) sudah di-update dengan content relevan (bukan placeholder "Conten materi pembelajaran."). Course 1 (M1) sudah punya content awal.

## Optimasi performa

- Database indexes di `database/indexes.sql` (run via `mysql -u root lms_db < database/indexes.sql`).
- Query di `courseModel.js` dan `enrollmentModel.js` dioptimasi dengan JOIN + GROUP BY (hilangkan subquery korelasi/N+1).
- MySQL connection pool di `config/db.js` dengan connectTimeout, charset utf8mb4, DECIMAL→number typeCast.
- In-memory TTL cache (`utils/cache.js`) untuk read-heavy published data.
- Gzip compression, ETag, static cache `max-age=7d` (production), `Cache-Control: private, no-store` for session HTML.

## Gotchas

- Rate limit: 10 attempts / 15 min on `POST /login` and `POST /register` → `429`.
- Health check: `GET /healthz` → `{ "status": "ok" }`, or `503` if DB unreachable.
- `catalogController.show` dan `views/courses/show.ejs`: pastikan null-check `currentUser` (bisa null untuk user belum login).
- `NODE_ENV=production` mengaktifkan secure cookie, EJS view cache, static cache `max-age=7d`. CSP allows `'self'` only — tidak ada inline script.
- bcrypt cost 10; login compare hash, register hash.
- Graceful shutdown: `SIGTERM`/`SIGINT` menutup HTTP server lalu MySQL pool.
- Production deploy: `docker compose up -d --build` atau PM2 (`npm ci --omit=dev`, `NODE_ENV=production pm2 start server.js -i max --name lms`). Di belakang proxy: `TRUST_PROXY_HOPS=1`, HTTPS, `proxy_pass` ke app.
- Jika docs dan behavior konflik, trust executable source (`server.js`, `package.json`, `schema.sql`) dan fix doc.

## Caching & error pages

- HTML session-dependent: `Cache-Control: private, no-store`. Static: `max-age=7d` hanya production, ETag on.
- Error/404: `title: 'Error'` agar browser title bukan hanya "LMS".

## UI/UX (student & instructor)

- CSS modern premium (`public/css/style.css`): glassmorphism navbar, gradient primary (`#2563eb → #7c3aed`), kartu dengan shadow/hover lift, progress bar dengan animasi shimmer, badge warna per peran, empty state dengan ikon, form input dengan focus ring, tombol gradient.
- Quiz: timer countdown, animasi slide-in pada kartu pertanyaan, highlight pilihan jawaban, score card di hasil, confetti-style badge lulus/tidak lulus.
- Responsive: breakpoint mobile `@media (max-width: 768px)` dan `@media (max-width: 480px)`.

## Docs

- `README.md` dalam Indonesian. Simpan perubahan agent-facing faktual di sini; tutorial di README, bukan AGENTS.md.
