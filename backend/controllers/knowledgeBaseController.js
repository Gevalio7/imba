const KnowledgeBase = require('../models/knowledgeBase');
const { asyncHandler } = require('../middleware/errorHandler');

// Получить все статьи
const getArticles = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page, categoryId, serviceId, isPublished } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 1000;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  // Фильтры
  const filters = {};
  if (categoryId) filters.categoryId = parseInt(categoryId, 10);
  if (serviceId) filters.serviceId = parseInt(serviceId, 10);
  if (isPublished !== undefined) filters.isPublished = isPublished === 'true';

  const result = await KnowledgeBase.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
    ...filters,
  });

  res.json(result);
});

// Получить статью по ID
const getArticleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const article = await KnowledgeBase.getById(articleId);

  if (!article) {
    return res.status(404).json({ message: 'Article not found' });
  }

  // Увеличиваем счетчик просмотров
  await KnowledgeBase.incrementViews(articleId);

  res.json(article);
});

// Создать статью
const createArticle = asyncHandler(async (req, res) => {
  console.log('📝 Создание статьи, тело запроса:', req.body);
  
  const data = {};
  data.title = req.body.title;
  data.content = req.body.content;
  data.categoryId = req.body.categoryId || null;
  data.tags = req.body.tags || null;
  data.serviceId = req.body.serviceId || null;
  data.isPublished = req.body.isPublished !== undefined ? req.body.isPublished : false;
  data.viewsCount = 0;
  data.createdBy = req.body.createdBy || null;

  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  console.log('📝 Данные для создания:', data);

  // Валидация обязательных полей
  if (!data.title) {
    return res.status(400).json({ message: 'title is required' });
  }

  if (!data.content) {
    return res.status(400).json({ message: 'content is required' });
  }

  const newArticle = await KnowledgeBase.create(data);
  
  console.log('✅ Статья создана:', newArticle);

  res.status(201).json(newArticle);
});

// Обновить статью
const updateArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.title !== undefined) data.title = req.body.title;
  if (req.body.content !== undefined) data.content = req.body.content;
  if (req.body.categoryId !== undefined) data.categoryId = req.body.categoryId;
  if (req.body.tags !== undefined) data.tags = req.body.tags;
  if (req.body.serviceId !== undefined) data.serviceId = req.body.serviceId;
  if (req.body.isPublished !== undefined) data.isPublished = req.body.isPublished;
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

  const updatedArticle = await KnowledgeBase.update(articleId, data);

  if (!updatedArticle) {
    return res.status(404).json({ message: 'Article not found' });
  }

  res.json(updatedArticle);
});

// Удалить статью
const deleteArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await KnowledgeBase.delete(articleId);

  if (!deleted) {
    return res.status(404).json({ message: 'Article not found' });
  }

  res.status(204).send();
});

// Поиск по тегам
const searchByTag = asyncHandler(async (req, res) => {
  const { tag } = req.query;

  if (!tag) {
    return res.status(400).json({ message: 'tag is required' });
  }

  const results = await KnowledgeBase.searchByTag(tag);
  res.json({ articles: results });
});

// Увеличить счетчик просмотров
const incrementViews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const result = await KnowledgeBase.incrementViews(articleId);

  if (!result) {
    return res.status(404).json({ message: 'Article not found' });
  }

  res.json(result);
});

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  searchByTag,
  incrementViews,
};
