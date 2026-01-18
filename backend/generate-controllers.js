const fs = require('fs');
const path = require('path');

// Создаём директорию controllers, если она не существует
const controllersDir = path.join(__dirname, 'controllers');
if (!fs.existsSync(controllersDir)) {
  fs.mkdirSync(controllersDir, { recursive: true });
}

// Читаем извлечённые интерфейсы из файла
const configPath = path.join(__dirname, 'extracted-interfaces.json');
if (!fs.existsSync(configPath)) {
  console.error('Файл extracted-interfaces.json не найден!');
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Ошибка чтения или парсинга extracted-interfaces.json:', error.message);
  process.exit(1);
}

if (typeof config !== 'object' || config === null) {
  console.error('Файл extracted-interfaces.json не содержит валидный объект!');
  process.exit(1);
}

const entities = Object.keys(config);
if (entities.length === 0) {
  console.log('В extracted-interfaces.json нет сущностей для генерации контроллеров.');
  process.exit(0);
}

function singularize(str) {
  if (str === 'PgpKeys') return 'PgpKey';
  if (str === 'EmailAddresses') return 'EmailAddress';
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
  if (str.endsWith('s')) return str.slice(0, -1);
  return str;
}

function generateController(entity) {
  const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
  const singular = singularize(entity);
  const fileName = modelName + 'Controller.js';
  const fields = Object.keys(config[entity]).filter(field => field !== 'isActive');

  const code = `const ${entity} = require('../models/${modelName}');
const { asyncHandler } = require('../middleware/errorHandler');

const get${entity} = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await ${entity}.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const get${singular}ById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ${singular.toLowerCase()}Id = parseInt(id, 10);

  if (isNaN(${singular.toLowerCase()}Id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const ${singular.toLowerCase()} = await ${entity}.getById(${singular.toLowerCase()}Id);

  if (!${singular.toLowerCase()}) {
    return res.status(404).json({ message: '${singular} not found' });
  }

  res.json(${singular.toLowerCase()});
});

const create${entity} = asyncHandler(async (req, res) => {
  const data = {};
  ${fields.map(field => `data.${field} = req.body.${field};`).join('\n  ')}
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.${fields[0]}) {
    return res.status(400).json({ message: '${fields[0]} is required' });
  }

  const new${singular} = await ${entity}.create(data);

  res.status(201).json(new${singular});
});

const update${entity} = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ${singular.toLowerCase()}Id = parseInt(id, 10);

  if (isNaN(${singular.toLowerCase()}Id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  ${fields.map(field => `if (req.body.${field} !== undefined) data.${field} = req.body.${field};`).join('\n  ')}
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updated${singular} = await ${entity}.update(${singular.toLowerCase()}Id, data);

  if (!updated${singular}) {
    return res.status(404).json({ message: '${singular} not found' });
  }

  res.json(updated${singular});
});

const delete${entity} = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ${singular.toLowerCase()}Id = parseInt(id, 10);

  if (isNaN(${singular.toLowerCase()}Id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await ${entity}.delete(${singular.toLowerCase()}Id);

  if (!deleted) {
    return res.status(404).json({ message: '${singular} not found' });
  }

  res.status(204).send();
});

module.exports = {
  get${entity},
  get${singular}ById,
  create${entity},
  update${entity},
  delete${entity},
};
`;

  const filePath = path.join(__dirname, 'controllers', fileName);
  fs.writeFileSync(filePath, code);
  console.log(`Generated ${filePath}`);
}

entities.forEach(entity => {
  generateController(entity);
});

console.log('All controllers generated.');
