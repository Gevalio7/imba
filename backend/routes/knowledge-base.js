const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  searchByTag,
  getArticlesByFilters,
  incrementViews,
} = require('../controllers/knowledgeBaseController');

// GET /knowledge-base - список статей с фильтрами
router.get('/', getArticles);

// GET /knowledge-base/search - поиск по тегам
router.get('/search', searchByTag);

// GET /knowledge-base/by-filters - статьи по категории и/или сервису
router.get('/by-filters', getArticlesByFilters);

// GET /knowledge-base/:id
router.get('/:id', getArticleById);

// POST /knowledge-base
router.post('/', protect, createArticle);

// PUT /knowledge-base/:id
router.put('/:id', protect, updateArticle);

// DELETE /knowledge-base/:id
router.delete('/:id', protect, deleteArticle);

// POST /knowledge-base/:id/view - увеличить счетчик просмотров
router.post('/:id/view', protect, incrementViews);

module.exports = router;
