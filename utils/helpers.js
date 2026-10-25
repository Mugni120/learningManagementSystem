const slugBase = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);

const MESSAGES = {
  'course-created': 'Course berhasil dibuat.',
  'course-updated': 'Course berhasil diperbarui.',
  'course-deleted': 'Course berhasil dihapus.',
  'course-published': 'Course dipublikasikan ke katalog.',
  'course-unpublished': 'Course dikembalikan ke draft.',
  'module-created': 'Modul berhasil ditambahkan.',
  'module-updated': 'Modul berhasil diperbarui.',
  'module-deleted': 'Modul beserta lesson-nya dihapus.',
  'lesson-created': 'Lesson berhasil ditambahkan.',
  'lesson-updated': 'Lesson berhasil diperbarui.',
  'lesson-deleted': 'Lesson berhasil dihapus.',
  'user-updated': 'User berhasil diperbarui.',
  enrolled: 'Anda berhasil enroll ke course ini.',
  'lesson-completed': 'Lesson ditandai selesai.',
  'assignment-created': 'Assignment berhasil dibuat.',
  'assignment-updated': 'Assignment berhasil diperbarui.',
  'assignment-deleted': 'Assignment berhasil dihapus.',
  'submission-saved': 'Submission tersimpan.',
  'submission-graded': 'Submission dinilai.',
  'quiz-created': 'Quiz berhasil dibuat.',
  'quiz-updated': 'Quiz berhasil diperbarui.',
  'quiz-deleted': 'Quiz berhasil dihapus.',
  'question-added': 'Pertanyaan ditambahkan.',
  'question-deleted': 'Pertanyaan dihapus.',
  'attempt-submitted': 'Jawaban terkirim dan dinilai otomatis.',
};

exports.slugify = slugBase;
exports.flashMessage = (req) => MESSAGES[req.query.msg] || null;
exports.httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};
