-- ============================================================
-- Learning Management System (LMS) - MySQL Schema
-- Stack: Node.js + Express + EJS + mysql2
-- Run:   mysql -u root < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS lms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lms_db;

-- ------------------------------------------------------------
-- 1. ROLE & USER (authentication & authorization)
-- ------------------------------------------------------------

CREATE TABLE roles (
  id         TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(30) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id       TINYINT UNSIGNED NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  bio           TEXT NULL,
  avatar_path   VARCHAR(255) NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. COURSE STRUCTURE (course management)
-- ------------------------------------------------------------

CREATE TABLE categories (
  id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80)  NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE courses (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  instructor_id  INT UNSIGNED NOT NULL,
  category_id    INT UNSIGNED NULL,
  title          VARCHAR(150) NOT NULL,
  slug           VARCHAR(180) NOT NULL UNIQUE,
  description    TEXT NULL,
  level          ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  status         ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  thumbnail_path VARCHAR(255) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id) REFERENCES users (id),
  CONSTRAINT fk_courses_category   FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
  INDEX idx_courses_status (status),
  INDEX idx_courses_instructor (instructor_id)
) ENGINE=InnoDB;

CREATE TABLE modules (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  title     VARCHAR(150) NOT NULL,
  position  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  UNIQUE KEY uq_modules_course_position (course_id, position)
) ENGINE=InnoDB;

CREATE TABLE lessons (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id        INT UNSIGNED NOT NULL,
  title            VARCHAR(150) NOT NULL,
  content          LONGTEXT NULL,
  video_url        VARCHAR(255) NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  position         SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_free_preview  BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
  UNIQUE KEY uq_lessons_module_position (module_id, position)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. ENROLLMENT & PROGRESS TRACKING
-- ------------------------------------------------------------

CREATE TABLE enrollments (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id    INT UNSIGNED NOT NULL,
  student_id   INT UNSIGNED NOT NULL,
  status       ENUM('active','completed','dropped') NOT NULL DEFAULT 'active',
  enrolled_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  CONSTRAINT fk_enrollments_course  FOREIGN KEY (course_id)  REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users (id)  ON DELETE CASCADE,
  UNIQUE KEY uq_enrollments_course_student (course_id, student_id),
  INDEX idx_enrollments_student (student_id)
) ENGINE=InnoDB;

CREATE TABLE lesson_progress (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NOT NULL,
  lesson_id     INT UNSIGNED NOT NULL,
  is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMP NULL,
  CONSTRAINT fk_progress_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson     FOREIGN KEY (lesson_id)     REFERENCES lessons (id)     ON DELETE CASCADE,
  UNIQUE KEY uq_progress_enrollment_lesson (enrollment_id, lesson_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. ASSIGNMENTS & GRADING
-- ------------------------------------------------------------

CREATE TABLE assignments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id   INT UNSIGNED NOT NULL,
  title       VARCHAR(150) NOT NULL,
  description TEXT NULL,
  due_at      DATETIME NULL,
  max_score   DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  INDEX idx_assignments_course (course_id)
) ENGINE=InnoDB;

CREATE TABLE submissions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT UNSIGNED NOT NULL,
  student_id   INT UNSIGNED NOT NULL,
  content      TEXT NULL,
  file_path    VARCHAR(255) NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score        DECIMAL(5,2) NULL,
  feedback     TEXT NULL,
  graded_by    INT UNSIGNED NULL,
  graded_at    TIMESTAMP NULL,
  CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
  CONSTRAINT fk_submissions_student    FOREIGN KEY (student_id)    REFERENCES users (id)      ON DELETE CASCADE,
  CONSTRAINT fk_submissions_grader     FOREIGN KEY (graded_by)     REFERENCES users (id)      ON DELETE SET NULL,
  UNIQUE KEY uq_submissions_assignment_student (assignment_id, student_id),
  INDEX idx_submissions_assignment_submitted (assignment_id, submitted_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. QUIZZES & AUTO-GRADING
-- ------------------------------------------------------------

CREATE TABLE quizzes (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id          INT UNSIGNED NOT NULL,
  title              VARCHAR(150) NOT NULL,
  description        TEXT NULL,
  time_limit_minutes SMALLINT UNSIGNED NULL,
  passing_score      DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  max_attempts       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quizzes_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  INDEX idx_quizzes_course (course_id)
) ENGINE=InnoDB;

CREATE TABLE quiz_questions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id       INT UNSIGNED NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice','true_false','essay') NOT NULL DEFAULT 'multiple_choice',
  points        DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  position      SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
  INDEX idx_questions_quiz (quiz_id)
) ENGINE=InnoDB;

CREATE TABLE quiz_options (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id INT UNSIGNED NOT NULL,
  option_text VARCHAR(255) NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
  position    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES quiz_questions (id) ON DELETE CASCADE,
  INDEX idx_options_question (question_id)
) ENGINE=InnoDB;

CREATE TABLE quiz_attempts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id      INT UNSIGNED NOT NULL,
  student_id   INT UNSIGNED NOT NULL,
  started_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  score        DECIMAL(5,2) NULL,
  passed       BOOLEAN NULL,
  CONSTRAINT fk_attempts_quiz    FOREIGN KEY (quiz_id)    REFERENCES quizzes (id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_student FOREIGN KEY (student_id) REFERENCES users (id)  ON DELETE CASCADE,
  INDEX idx_attempts_quiz_student (quiz_id, student_id)
) ENGINE=InnoDB;

CREATE TABLE quiz_answers (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempt_id         INT UNSIGNED NOT NULL,
  question_id        INT UNSIGNED NOT NULL,
  selected_option_id INT UNSIGNED NULL,
  answer_text        TEXT NULL,
  is_correct         BOOLEAN NULL,
  points_earned      DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_answers_attempt  FOREIGN KEY (attempt_id)         REFERENCES quiz_attempts (id)  ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id)        REFERENCES quiz_questions (id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_option   FOREIGN KEY (selected_option_id) REFERENCES quiz_options (id)   ON DELETE SET NULL,
  UNIQUE KEY uq_answers_attempt_question (attempt_id, question_id)
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO roles (name) VALUES
  ('admin'),
  ('instructor'),
  ('student');

-- Demo accounts (bcrypt cost 10):
--   admin@lms.test      / Admin123!
--   instructor@lms.test / Instructor123!
--   student@lms.test    / Student123!
INSERT INTO users (role_id, full_name, email, password_hash) VALUES
  (1, 'Admin Utama',      'admin@lms.test',      '$2y$10$UNW4vBKbuisYF0r1ZJdg5ukXjEH6s1vNPkMtYJ4xiFqOl4XYt8ogu'),
  (2, 'Dosen Pengampu',   'instructor@lms.test', '$2y$10$fmz0F.Jc.W.spwW9VNmxu.tUk4Z3WFHrd4r7oCy6cNOdaIfmp7Y.S'),
  (3, 'Mahasiswa Contoh', 'student@lms.test',    '$2y$10$I7fTzj8wUd7Ps6RBwHGfuuAijm.fXUVwUlNDw9OvHbn/HvnoFXh66');

INSERT INTO categories (name, slug) VALUES
  ('Web Development', 'web-development'),
  ('Data Science',    'data-science'),
  ('UI/UX Design',    'ui-ux-design'),
  ('Business',        'business');
