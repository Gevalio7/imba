const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  searchByTag,
  incrementViews,
} = require('../controllers/knowledgeBaseController');

// GET /knowledge-base - список статей с фильтрами
router.get('/', getArticles);

// GET /knowledge-base/search - поиск по тегам
router.get('/search', searchByTag);

// GET /knowledge-base/:id
router.get('/:id', getArticleById);

// POST /knowledge-base
router.post('/', createArticle);

// PUT /knowledge-base/:id
router.put('/:id', updateArticle);

// DELETE /knowledge-base/:id
router.delete('/:id', deleteArticle);

// POST /knowledge-base/:id/view - увеличить счетчик просмотров
router.post('/:id/view', incrementViews);

module.exports = router;
