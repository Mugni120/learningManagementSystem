const db = require('../config/db');
const categoryModel = require('../models/categoryModel');
const courseModel = require('../models/courseModel');
const { flashMessage, httpError } = require('../utils/helpers');
const { slugify } = require('../utils/helpers');

const validate = (body) => {
  const errors = [];
  if (!body.name || !body.name.trim()) errors.push('Nama kategori wajib diisi.');
  if (!body.slug || !body.slug.trim()) errors.push('Slug wajib diisi.');
  return errors;
};

exports.index = async (req, res, next) => {
  try {
    const categories = await categoryModel.findAll();
    res.render('admin/categories', {
      title: 'Manajemen Kategori',
      categories,
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = async (req, res, next) => {
  try {
    res.render('admin/category-form', {
      title: 'Kategori Baru',
      category: null,
      errors: [],
      msg: null,
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validate(req.body);
    const slug = slugify(req.body.slug || req.body.name);
    const exists = await categoryModel.slugExists(slug);
    if (exists) errors.push('Slug sudah digunakan.');
    if (errors.length) {
      return res.status(422).render('admin/category-form', {
        title: 'Kategori Baru',
        category: req.body,
        errors,
        msg: null,
      });
    }
    await categoryModel.create({ name: req.body.name.trim(), slug });
    res.redirect('/admin/categories?msg=created');
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const category = await categoryModel.findById(Number(req.params.id));
    if (!category) throw httpError(404, 'Kategori tidak ditemukan.');
    res.render('admin/category-form', {
      title: 'Edit Kategori',
      category,
      errors: [],
      msg: null,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const category = await categoryModel.findById(Number(req.params.id));
    if (!category) throw httpError(404, 'Kategori tidak ditemukan.');
    const errors = validate(req.body);
    const slug = slugify(req.body.slug || req.body.name);
    const exists = await categoryModel.slugExists(slug, category.id);
    if (exists) errors.push('Slug sudah digunakan.');
    if (errors.length) {
      return res.status(422).render('admin/category-form', {
        title: 'Edit Kategori',
        category: { ...category, ...req.body },
        errors,
        msg: null,
      });
    }
    await categoryModel.update(category.id, { name: req.body.name.trim(), slug });
    res.redirect('/admin/categories?msg=updated');
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const category = await categoryModel.findById(Number(req.params.id));
    if (!category) throw httpError(404, 'Kategori tidak ditemukan.');
    const [used] = await db.query('SELECT 1 FROM courses WHERE category_id = ? LIMIT 1', [category.id]);
    if (used.length) {
      const err = new Error('Kategori masih digunakan oleh course. Hapus atau pindahkan course terlebih dahulu.');
      err.status = 400;
      throw err;
    }
    await categoryModel.remove(category.id);
    res.redirect('/admin/categories?msg=deleted');
  } catch (err) {
    next(err);
  }
};
