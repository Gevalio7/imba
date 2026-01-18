const fs = require('fs');
const path = require('path');

// Создаём директорию routes, если она не существует
const routesDir = path.join(__dirname, 'routes');
if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
}

// Читаем извлечённые интерфейсы из файла
const extractedInterfacesPath = path.join(__dirname, 'extracted-interfaces.json');
if (!fs.existsSync(extractedInterfacesPath)) {
  console.error('Файл extracted-interfaces.json не найден!');
  process.exit(1);
}

let extractedInterfaces;
try {
  extractedInterfaces = JSON.parse(fs.readFileSync(extractedInterfacesPath, 'utf8'));
} catch (error) {
  console.error('Ошибка чтения или парсинга extracted-interfaces.json:', error.message);
  process.exit(1);
}

if (typeof extractedInterfaces !== 'object' || extractedInterfaces === null) {
  console.error('Файл extracted-interfaces.json не содержит валидный объект!');
  process.exit(1);
}

// Получаем список сущностей из ключей объекта
const entities = Object.keys(extractedInterfaces);
if (entities.length === 0) {
  console.log('В extracted-interfaces.json нет сущностей для генерации маршрутов.');
  process.exit(0);
}

// Генерируем singularMap динамически
const singularMap = {};
entities.forEach(entity => {
  // Убираем 's' в конце, если есть, для получения единственного числа
  const singular = entity.replace(/s$/, '');
  singularMap[entity] = singular;
});

entities.forEach(entity => {
  const singular = singularMap[entity];
  const plural = entity.charAt(0).toLowerCase() + entity.slice(1);
  const controllerName = plural + 'Controller';

  const getPlural = 'get' + entity;
  const getById = 'get' + singular + 'ById';
  const create = 'create' + entity;
  const update = 'update' + entity;
  const del = 'delete' + entity;

  const content = `const express = require('express');
const router = express.Router();
const {
  ${getPlural},
  ${getById},
  ${create},
  ${update},
  ${del},
} = require('../controllers/${controllerName}');

// GET /${plural} - список с query params
router.get('/', ${getPlural});

// GET /${plural}/:id
router.get('/:id', ${getById});

// POST /${plural}
router.post('/', ${create});

// PUT /${plural}/:id
router.put('/:id', ${update});

// DELETE /${plural}/:id
router.delete('/:id', ${del});

module.exports = router;
`;

  const filePath = path.join(__dirname, 'routes', plural + '.js');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Generated ${filePath}`);
});

console.log('All routes generated.');
