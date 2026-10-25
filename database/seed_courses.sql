-- ============================================================
-- SEED DATA: 12 Course Pemrograman untuk Instruktur
-- Jalankan: mysql -u root lms_db < database/seed_courses.sql
-- ============================================================

-- Pastikan ada cukup kategori
INSERT IGNORE INTO categories (name, slug) VALUES
  ('Web Development', 'web-development'),
  ('Data Science',    'data-science'),
  ('Mobile Development', 'mobile-development'),
  ('UI/UX Design',    'ui-ux-design'),
  ('DevOps & Cloud',  'devops-cloud'),
  ('Game Development','game-development'),
  ('Cybersecurity',   'cybersecurity'),
  ('Business',        'business');

-- 12 Course pemrograman relevan (instructor_id = 2 = Dosen Pengampu)
INSERT IGNORE INTO courses (instructor_id, category_id, title, slug, description, level, status, thumbnail_path) VALUES
(2, 1, 'Belajar Express untuk Pemula', 'belajar-express-untuk-pemula', 'Course praktis membangun web app dengan Node.js dan Express, dari routing sampai deployment.', 'beginner', 'published', 'https://images.unsplash.com/photo-1502753127957-d59b28b16163?w=400&q=80'),
(2, 1, 'React Modern: Dari Nol hingga Mahir', 'react-modern-dari-nol-hingga-mahir', 'Pelajari React dengan hooks, context API, dan deployment aplikasi modern.', 'beginner', 'published', 'https://images.unsplash.com/photo-1633356122102-3fe60976c57c?w=400&q=80'),
(2, 1, 'Next.js 14 App Router & Server Actions', 'nextjs-14-app-router-server-actions', 'Kuasai Next.js 14 dengan App Router, Server Components, dan Server Actions.', 'intermediate', 'published', 'https://images.unsplash.com/photo-1619448917162-d3d4e1a2e72e?w=400&q=80'),
(2, 2, 'Python untuk Data Analysis', 'python-untuk-data-analysis', 'Analisis data dengan Pandas, NumPy, dan visualisasi Matplotlib/Seaborn.', 'beginner', 'published', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80'),
(2, 2, 'Machine Learning dengan Scikit-Learn', 'machine-learning-dengan-scikit-learn', 'Membangun model ML dari dasar: klasifikasi, regresi, clustering, dan evaluasi.', 'intermediate', 'published', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&q=80'),
(2, 3, 'React Native: Buat Aplikasi Mobile', 'react-native-buat-aplikasi-mobile', 'Pengembangan aplikasi iOS dan Android dengan React Native dan Expo.', 'beginner', 'published', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80'),
(2, 3, 'Flutter: Aplikasi Cross-Platform', 'flutter-aplikasi-cross-platform', 'Buat aplikasi mobile untuk iOS dan Android dari satu codebase dengan Flutter.', 'beginner', 'published', 'https://images.unsplash.com/photo-1584798381280-476100b170ab?w=400&q=80'),
(2, 4, 'Figma untuk UI/UX Designer', 'figma-untuk-ui-ux-designer', 'Desain antarmuka pengguna yang indah dan mudah digunakan dengan Figma.', 'beginner', 'published', 'https://images.unsplash.com/photo-1586718041773-73304b370664?w=400&q=80'),
(2, 5, 'Docker & Kubernetes untuk DevOps', 'docker-kubernetes-untuk-devops', 'Containerisasi aplikasi dan orkestrasi dengan Docker dan Kubernetes.', 'intermediate', 'published', 'https://images.unsplash.com/photo-1603564837175-e76f32e781d4?w=400&q=80'),
(2, 5, 'AWS Cloud Practitioner Essentials', 'aws-cloud-practitioner-essentials', 'Dasar-dasar komputasi awan AWS, layanan inti, dan arsitektur cloud.', 'beginner', 'published', 'https://images.unsplash.com/photo-1451187580459-43490279c0df?w=400&q=80'),
(2, 6, 'Unity Game Development untuk Pemula', 'unity-game-development-untuk-pemula', 'Buat game 2D dan 3D pertama Anda dengan Unity dan C#.', 'beginner', 'published', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80'),
(2, 7, 'Cybersecurity Fundamental', 'cybersecurity-fundamental', 'Keamanan siber dasar: jaringan, enkripsi, dan perlindungan ancaman siber.', 'intermediate', 'published', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80');

-- Tambahkan modul dan lesson untuk setiap course
-- Modul untuk Express course (id=1)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (1, 'Pengenalan Node.js & Express', 1),
  (1, 'Routing dan Middleware', 2),
  (1, 'Database dengan MySQL', 3),
  (1, 'Deployment Produksi', 4);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (1, 'Apa itu Node.js?', 'Node.js adalah runtime JavaScript di sisi server.', NULL, 15, 1, TRUE),
  (1, 'Menginstal Node.js dan Express', 'Cara menginstal Node.js dan membuat proyek Express pertama.', NULL, 20, 2, TRUE),
  (2, 'Routing Dasar Express', 'Membuat route GET, POST, PUT, DELETE.', NULL, 25, 1, FALSE),
  (2, 'Middleware Bawaan dan Custom', 'Menggunakan express.json, express.urlencoded, dan custom middleware.', NULL, 30, 2, FALSE),
  (3, 'Koneksi ke MySQL dengan mysql2', 'Membuat koneksi pool dan menjalankan query.', NULL, 35, 1, FALSE),
  (4, 'Deploy ke Produksi', 'Deploy aplikasi Express ke server produksi dengan PM2.', NULL, 40, 1, FALSE);

-- Modul untuk React course (id=2)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (2, 'Dasar React dan JSX', 1),
  (2, 'Component dan Props', 2),
  (2, 'State dan Lifecycle', 3),
  (2, 'React Hooks', 4);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (5, 'Apa itu React?', 'Pengenalan library React dan keuntungannya.', NULL, 15, 1, TRUE),
  (5, 'Membuat Component Pertama', 'Membuat functional component dengan JSX.', NULL, 20, 2, TRUE),
  (6, 'Props dan Props Drilling', 'Mengirim data antar component dengan props.', NULL, 25, 1, FALSE),
  (7, 'useState dan useEffect', 'Mengelola state dan side effect dengan hooks.', NULL, 30, 1, FALSE);

-- Modul untuk Next.js course (id=3)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (3, 'Pengenalan Next.js 14', 1),
  (3, 'App Router', 2),
  (3, 'Server Actions', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (8, 'Next.js vs React SPA', 'Perbedaan Next.js dengan React SPA tradisional.', NULL, 15, 1, TRUE),
  (9, 'Routing dengan App Router', 'Membuat route dengan folder dan file route.ts.', NULL, 25, 1, FALSE),
  (10, 'Server Actions', 'Mengubah data tanpa API route tradisional.', NULL, 30, 1, FALSE);

-- Modul untuk Python Data Analysis (id=4)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (4, 'Pengenalan Python dan Pandas', 1),
  (4, 'Manipulasi Data dengan Pandas', 2),
  (4, 'Visualisasi Data', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (11, 'Instalasi Python dan Pandas', 'Setup environment untuk data analysis.', NULL, 20, 1, TRUE),
  (12, 'DataFrame dan Operasi Dasar', 'Membuat dan memanipulasi DataFrame.', NULL, 30, 1, FALSE),
  (13, 'Plot dengan Matplotlib', 'Membuat grafik dan visualisasi data.', NULL, 25, 1, FALSE);

-- Modul untuk Machine Learning (id=5)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (5, 'Pengenalan Machine Learning', 1),
  (5, 'Supervised Learning', 2),
  (5, 'Unsupervised Learning', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (14, 'Apa itu Machine Learning?', 'Konsep dasar ML dan jenis-jenisnya.', NULL, 20, 1, TRUE),
  (15, 'Regresi dan Klasifikasi', 'Model regresi linier dan klasifikasi logistik.', NULL, 35, 1, FALSE),
  (16, 'Clustering dengan K-Means', 'Mengelompokkan data tanpa label.', NULL, 30, 1, FALSE);

-- Modul untuk React Native (id=6)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (6, 'Setup React Native', 1),
  (6, 'Navigation dan Screen', 2),
  (6, 'Native Modules', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (17, 'Instalasi Expo dan React Native', 'Setup environment development mobile.', NULL, 25, 1, TRUE),
  (18, 'React Navigation', 'Membuat navigasi antar layar aplikasi.', NULL, 30, 1, FALSE),
  (19, 'Akses Fitur Native', 'Menggunakan kamera, lokasi, dan fitur native.', NULL, 35, 1, FALSE);

-- Modul untuk Flutter (id=7)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (7, 'Dasar Flutter dan Dart', 1),
  (7, 'Widget dan Layout', 2),
  (7, 'State Management', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (20, 'Instalasi Flutter SDK', 'Setup Flutter untuk development.', NULL, 25, 1, TRUE),
  (21, 'Stateless dan Stateful Widget', 'Membuat widget Flutter dasar.', NULL, 30, 1, FALSE),
  (22, 'Provider State Management', 'Mengelola state aplikasi dengan Provider.', NULL, 35, 1, FALSE);

-- Modul untuk Figma (id=8)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (8, 'Pengenalan Figma', 1),
  (8, 'Design System', 2),
  (8, 'Prototyping', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (23, 'Antarmuka Figma', 'Pengenalan workspace dan tools Figma.', NULL, 20, 1, TRUE),
  (24, 'Membuat Design System', 'Membuat komponen reusable dan style guide.', NULL, 35, 1, FALSE),
  (25, 'Prototyping Interaktif', 'Membuat prototype dengan animasi transisi.', NULL, 30, 1, FALSE);

-- Modul untuk Docker & Kubernetes (id=9)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (9, 'Docker Dasar', 1),
  (9, 'Docker Compose', 2),
  (9, 'Kubernetes Intro', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (26, 'Apa itu Container?', 'Konsep container vs virtual machine.', NULL, 20, 1, TRUE),
  (27, 'Dockerfile dan Image', 'Membuat image Docker untuk aplikasi.', NULL, 35, 1, FALSE),
  (28, 'Kubernetes Pod dan Deployment', 'Mengelola container di klaster K8s.', NULL, 40, 1, FALSE);

-- Modul untuk AWS (id=10)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (10, 'Dasar AWS Cloud', 1),
  (10, 'EC2 dan S3', 2),
  (10, 'IAM dan Keamanan', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (29, 'Apa itu Cloud Computing?', 'Konsep cloud dan manfaatnya.', NULL, 20, 1, TRUE),
  (30, 'Launch EC2 Instance', 'Membuat server virtual di AWS.', NULL, 35, 1, FALSE),
  (31, 'Penyimpanan dengan S3', 'Menyimpan file di Amazon S3.', NULL, 30, 1, FALSE);

-- Modul untuk Unity (id=11)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (11, 'Pengenalan Unity', 1),
  (11, 'GameObject dan Component', 2),
  (11, 'C# Scripting', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (32, 'Instalasi Unity Hub', 'Setup Unity untuk development game.', NULL, 25, 1, TRUE),
  (33, 'GameObject dan Transform', 'Memahami objek dalam scene Unity.', NULL, 30, 1, FALSE),
  (34, 'C# Dasar untuk Game', 'Membuat skrip permainan dengan C#.', NULL, 35, 1, FALSE);

-- Modul untuk Cybersecurity (id=12)
INSERT IGNORE INTO modules (course_id, title, position) VALUES
  (12, 'Dasar Keamanan Siber', 1),
  (12, 'Jaringan dan Enkripsi', 2),
  (12, 'Penetration Testing', 3);

INSERT IGNORE INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview) VALUES
  (34, 'Apa itu Cybersecurity?', 'Konsep dasar keamanan informasi.', NULL, 20, 1, TRUE),
  (35, 'TCP/IP dan Enkripsi SSL', 'Protokol jaringan dan enkripsi data.', NULL, 35, 1, FALSE),
  (36, 'Pengujian Keamanan Dasar', 'Menguji keamanan sistem dengan tool dasar.', NULL, 40, 1, FALSE);

-- ============================================================
-- SELESAI
-- ============================================================
