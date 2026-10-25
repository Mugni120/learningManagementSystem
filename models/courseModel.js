const db = require('../config/db');
const { get, set, del, flushByPrefix } = require('../utils/cache');

const COURSE_SELECT_BASE = `
  SELECT c.*, u.full_name AS instructor_name, cat.name AS category_name,
    COUNT(DISTINCT m.id) AS module_count,
    COUNT(DISTINCT l.id) AS lesson_count,
    COUNT(DISTINCT e.id) AS student_count
  FROM courses c
  JOIN users u ON u.id = c.instructor_id
  LEFT JOIN categories cat ON cat.id = c.category_id
  LEFT JOIN modules m ON m.course_id = c.id
  LEFT JOIN lessons l ON l.module_id = m.id
  LEFT JOIN enrollments e ON e.course_id = c.id`;

const COURSE_GROUP_BY = ` GROUP BY c.id, u.id, cat.id`;

const attachTree = async (course) => {
  if (!course) return null;
  const [modules] = await db.query(
    'SELECT * FROM modules WHERE course_id = ? ORDER BY position',
    [course.id]
  );
  const [lessons] = await db.query(
    `SELECT l.* FROM lessons l
     JOIN modules m ON m.id = l.module_id
     WHERE m.course_id = ?
     ORDER BY m.position, l.position`,
    [course.id]
  );
  course.modules = modules.map((m) => ({
    ...m,
    lessons: lessons.filter((l) => l.module_id === m.id),
  }));
  return course;
};

exports.findPublishedCatalog = async () => {
  const key = 'published:catalog';
  const cached = get(key);
  if (cached) return cached;
  const [rows] = await db.query(
    `${COURSE_SELECT_BASE} WHERE c.status = 'published'${COURSE_GROUP_BY} ORDER BY c.created_at DESC`
  );
  const result = rows;
  set(key, result);
  return result;
};

exports.findByInstructor = async (userId) => {
  const [rows] = await db.query(
    `${COURSE_SELECT_BASE} WHERE c.instructor_id = ?${COURSE_GROUP_BY} ORDER BY c.updated_at DESC`,
    [userId]
  );
  return rows;
};

exports.findAllForAdmin = async () => {
  const [rows] = await db.query(`${COURSE_SELECT_BASE}${COURSE_GROUP_BY} ORDER BY c.updated_at DESC`);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(`${COURSE_SELECT_BASE} WHERE c.id = ?${COURSE_GROUP_BY}`, [id]);
  return rows[0] || null;
};

exports.findPublishedTreeBySlug = async (slug) => {
  const key = `published:tree:${slug}`;
  const cached = get(key);
  if (cached) return cached;
  const [rows] = await db.query(
    `${COURSE_SELECT_BASE} WHERE c.slug = ? AND c.status = 'published'${COURSE_GROUP_BY}`,
    [slug]
  );
  const course = rows[0] || null;
  const result = course ? await attachTree(course) : null;
  if (result) set(key, result);
  else del(key);
  return result;
};

exports.findTreeById = async (id) => {
  const [rows] = await db.query(`${COURSE_SELECT_BASE} WHERE c.id = ?${COURSE_GROUP_BY}`, [id]);
  return attachTree(rows[0] || null);
};

exports.slugExists = async (slug, exceptId = null) => {
  const [rows] = await db.query(
    'SELECT 1 FROM courses WHERE slug = ? AND id <> ? LIMIT 1',
    [slug, exceptId]
  );
  return rows.length > 0;
};

exports.uniqueSlug = async (base, exceptId = null) => {
  let slug = base || 'course';
  let suffix = 2;
  while (await exports.slugExists(slug, exceptId)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
};

exports.create = async ({ instructor_id, category_id, title, slug, description, level, status }) => {
  const [result] = await db.query(
    `INSERT INTO courses (instructor_id, category_id, title, slug, description, level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [instructor_id, category_id, title, slug, description, level, status]
  );
  flushByPrefix('published:');
  return result.insertId;
};

exports.update = async (id, { category_id, title, slug, description, level }) => {
  await db.query(
    `UPDATE courses SET category_id = ?, title = ?, slug = ?, description = ?, level = ?
     WHERE id = ?`,
    [category_id, title, slug, description, level, id]
  );
  flushByPrefix('published:');
};

exports.setStatus = async (id, status) => {
  await db.query('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
  flushByPrefix('published:');
};

exports.remove = async (id) => {
  await db.query('DELETE FROM courses WHERE id = ?', [id]);
  flushByPrefix('published:');
};

exports.stats = async () => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total,
            SUM(status = 'published') AS published,
            SUM(status = 'draft') AS draft,
            SUM(status = 'archived') AS archived
     FROM courses`
  );
  return rows[0];
};
