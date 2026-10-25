-- ============================================================
-- DATABASE INDEXES FOR PERFORMANCE OPTIMIZATION
-- Jalankan: mysql -u root lms_db < database/indexes.sql
-- ============================================================

-- Courses: frequently queried by status, instructor, slug
CREATE INDEX IF NOT EXISTS idx_courses_status_instructor ON courses(status, instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

-- Enrollments: frequently queried by student, course
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_student ON enrollments(course_id, student_id);

-- Lesson progress: frequently queried by enrollment, lesson
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- Modules: frequently queried by course
CREATE INDEX IF NOT EXISTS idx_modules_course_position ON modules(course_id, position);

-- Lessons: frequently queried by module
CREATE INDEX IF NOT EXISTS idx_lessons_module_position ON lessons(module_id, position);

-- Quizzes: frequently queried by course
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);

-- Quiz questions: frequently queried by quiz
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_position ON quiz_questions(quiz_id, position);

-- Quiz options: frequently queried by question
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id);

-- Quiz attempts: frequently queried by quiz+student
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_student ON quiz_attempts(quiz_id, student_id, submitted_at);

-- Quiz answers: frequently queried by attempt+question
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt_question ON quiz_answers(attempt_id, question_id);

-- Assignments: frequently queried by course
CREATE INDEX IF NOT EXISTS idx_assignments_course_due ON assignments(course_id, due_at);

-- Submissions: frequently queried by assignment+student
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_student ON submissions(assignment_id, student_id);

-- Users: frequently queried by email, role, active
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Sessions: frequently queried by session_id, expires
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- ============================================================
-- SELESAI
-- ============================================================
