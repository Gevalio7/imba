# 🚀 Руководство по генерации кода

## 📋 Обзор

Полностью автоматизированная система генерации кода для полного стека приложения.

## 🔄 Новый поток работы

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Vue файлы с интерфейсами                                 │
│    src/pages/apps/settings/**/*.vue                         │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. extract-interfaces.js                                    │
│    Извлекает TypeScript интерфейсы                          │
│    Удаляет дублирующееся поле status (если есть isActive)   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. extracted-interfaces.json                                │
│    Промежуточный файл с интерфейсами                        │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. generate-sql-tables.js                                   │
│    Генерирует SQL скрипты для создания таблиц               │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. migrations/                                              │
│    - drop-all-tables.sql   (удаление всех таблиц)           │
│    - create-all-tables.sql (создание новых таблиц)          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. apply-migrations.js --force                              │
│    Применяет миграции к PostgreSQL БД                       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. extract-from-db.js                                       │
│    Извлекает актуальную структуру из БД                     │
│    Обновляет extracted-interfaces.json                      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. generate-models.js                                       │
│    Генерирует модели для работы с БД                        │
│    backend/models/*.js                                      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. generate-controllers.js                                  │
│    Генерирует контроллеры с CRUD операциями                 │
│    backend/controllers/*.js                                 │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. generate-routes.js                                      │
│     Генерирует Express роуты                                │
│     backend/routes/*.js                                     │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. generate-vue-pages.js (опционально)                     │
│     Обновляет Vue страницы с API интеграцией                │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Ключевые улучшения

### ✅ Решена проблема дублирования status/isActive

**Было:**
```typescript
interface SLA {
  status: number // 1 - активен, 2 - не активен
  isActive: boolean
}
```

**Стало:**
```typescript
interface SLA {
  isActive: boolean  // true = активен, false = не активен
}
```

**Преимущества:**
- ✅ Нет дублирования данных
- ✅ Нет риска рассинхронизации
- ✅ Проще логика на фронте и бэке
- ✅ Меньше места в БД

### ✅ БД как единый источник истины

Теперь структура БД генерируется из интерфейсов, а затем все остальные файлы генерируются из БД. Это гарантирует полную согласованность.

## 🚀 Использование

### Вариант 1: Автоматическая генерация всего (РЕКОМЕНДУЕТСЯ)

```bash
cd backend
node generate-all.js --force
```

Этот скрипт выполнит все шаги автоматически:
1. Извлечет интерфейсы из Vue
2. Сгенерирует SQL скрипты
3. Применит миграции к БД (удалит старые таблицы!)
4. Извлечет структуру из БД
5. Сгенерирует модели, контроллеры, роуты

### Вариант 2: Без миграции БД

Если вы хотите только обновить код, но не трогать БД:

```bash
cd backend
node generate-all.js --skip-db
```

### Вариант 3: Пошаговое выполнение

Для отладки или детального контроля:

```bash
cd backend

# Шаг 1: Извлечь интерфейсы из Vue файлов
node extract-interfaces.js

# Шаг 2: Сгенерировать SQL скрипты
node generate-sql-tables.js

# Шаг 3: Проверить SQL скрипты (опционально)
cat migrations/create-all-tables.sql

# Шаг 4: Применить миграции к БД
node apply-migrations.js --force

# Шаг 5: Извлечь структуру из БД
node extract-from-db.js

# Шаг 6: Сгенерировать модели
node generate-models.js

# Шаг 7: Сгенерировать контроллеры
node generate-controllers.js

# Шаг 8: Сгенерировать роуты
node generate-routes.js

# Шаг 9: Обновить Vue страницы (опционально)
node generate-vue-pages.js
```

## 📁 Структура сгенерированных файлов

```
backend/
├── migrations/
│   ├── drop-all-tables.sql      # SQL для удаления всех таблиц
│   └── create-all-tables.sql    # SQL для создания всех таблиц
├── models/
│   ├── sla.js                   # Модель для работы с таблицей sla
│   ├── priorities.js
│   └── ...                      # 61 модель
├── controllers/
│   ├── slaController.js         # CRUD контроллер для SLA
│   ├── prioritiesController.js
│   └── ...                      # 61 контроллер
└── routes/
    ├── sla.js                   # Express роуты для SLA
    ├── priorities.js
    └── ...                      # 61 роут
```

## 🔧 Конфигурация

### Переменные окружения (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
```

### Настройка интерфейсов в Vue

В ваших Vue файлах определите интерфейсы:

```vue
<script setup lang="ts">
interface SLA {
  id: number
  name: string
  description: string
  responseTime: number // в часах
  resolutionTime: number // в часах
  isActive: boolean
  createdAt: string
  updatedAt: string
}
</script>
```

**Важно:**
- Используйте только `isActive: boolean` для статуса
- НЕ используйте `status: number` вместе с `isActive`
- Системные поля `id`, `createdAt`, `updatedAt` добавляются автоматически

## 📊 Пример сгенерированной таблицы

```sql
-- Таблица: sla (sLA)
CREATE TABLE IF NOT EXISTS sla (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  response_time INTEGER,
  resolution_time INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_sla_name ON sla(name);
CREATE INDEX IF NOT EXISTS idx_sla_is_active ON sla(is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_sla_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sla_updated_at
  BEFORE UPDATE ON sla
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_updated_at();
```

## 🎨 Пример сгенерированной модели

```javascript
const { pool } = require('../config/db');

class SLA {
  static tableName = 'sla';
  static fields = 'name, description, responseTime, resolutionTime';

  static async getAll(options = {}) {
    // Поддержка поиска, сортировки, пагинации
    // ...
  }

  static async getById(id) {
    // Получение по ID
    // ...
  }

  static async create(sla) {
    // Создание новой записи
    // ...
  }

  static async update(id, sla) {
    // Обновление записи
    // ...
  }

  static async delete(id) {
    // Удаление записи
    // ...
  }
}

module.exports = SLA;
```

## 🎮 Пример сгенерированного контроллера

```javascript
const SLA = require('../models/sla');
const { asyncHandler } = require('../middleware/errorHandler');

const getSLA = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;
  const result = await SLA.getAll({ q, sortBy, orderBy, itemsPerPage, page });
  res.json(result);
});

const getSLAById = asyncHandler(async (req, res) => {
  const sla = await SLA.getById(parseInt(req.params.id));
  if (!sla) return res.status(404).json({ message: 'SLA not found' });
  res.json(sla);
});

// ... create, update, delete

module.exports = { getSLA, getSLAById, createSLA, updateSLA, deleteSLA };
```

## 🛣️ Пример сгенерированного роута

```javascript
const express = require('express');
const router = express.Router();
const { getSLA, getSLAById, createSLA, updateSLA, deleteSLA } = require('../controllers/slaController');

router.get('/', getSLA);           // GET /sla
router.get('/:id', getSLAById);    // GET /sla/:id
router.post('/', createSLA);       // POST /sla
router.put('/:id', updateSLA);     // PUT /sla/:id
router.delete('/:id', deleteSLA);  // DELETE /sla/:id

module.exports = router;
```

## ⚠️ Важные замечания

### 1. Резервное копирование

**ВСЕГДА** делайте резервную копию БД перед запуском миграций:

```bash
pg_dump -U your_user your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Production окружение

Скрипт `apply-migrations.js` **запрещен** в production окружении. Для production используйте ручное выполнение SQL:

```bash
psql -U your_user -d your_db -f migrations/drop-all-tables.sql
psql -U your_user -d your_db -f migrations/create-all-tables.sql
```

### 3. Проверка перед применением

Всегда проверяйте сгенерированные SQL скрипты перед применением:

```bash
cat backend/migrations/create-all-tables.sql
```

## 📈 Статистика последней генерации

- ✅ **55 сущностей** извлечено из Vue файлов
- ✅ **61 таблица** создано в БД (включая старые)
- ✅ **61 модель** сгенерировано
- ✅ **61 контроллер** сгенерировано
- ✅ **61 роут** сгенерировано

## 🐛 Устранение проблем

### Проблема: "Файл extracted-interfaces.json не найден"

**Решение:**
```bash
cd backend
node extract-interfaces.js
```

### Проблема: "Ошибка подключения к БД"

**Решение:**
1. Проверьте файл `.env`
2. Убедитесь что PostgreSQL запущен
3. Проверьте права доступа

### Проблема: "Таблица уже существует"

**Решение:**
```bash
cd backend
node apply-migrations.js --force  # Удалит и пересоздаст все таблицы
```

### Проблема: Дублирующиеся таблицы (acl и acls)

Это происходит если в БД уже были старые таблицы. Решение:

```bash
# Удалить старые таблицы вручную
psql -U your_user -d your_db -c "DROP TABLE IF EXISTS acls, admin_notifications, communication_notifications_settings, processes_automation_settings, test_entities, users_groups_roles_settings CASCADE;"

# Затем запустить миграцию
cd backend
node apply-migrations.js --force
```

## 💡 Советы и лучшие практики

### 1. Именование полей

**Хорошо:**
```typescript
interface Entity {
  name: string           // Обязательное поле
  description: string    // Длинный текст
  isActive: boolean      // Статус активности
}
```

**Плохо:**
```typescript
interface Entity {
  status: number         // ❌ Не используйте вместе с isActive
  isActive: boolean
}
```

### 2. Типы полей

- `string` → `VARCHAR(255)` или `TEXT` (для длинных текстов)
- `number` → `INTEGER`
- `boolean` → `BOOLEAN`
- `string[]` → `TEXT[]`
- `string | null` → `VARCHAR(255)` (nullable)

### 3. Обязательные поля

Поля `name`, `title`, `email`, `username` автоматически помечаются как `NOT NULL`.

### 4. Индексы

Автоматически создаются индексы для:
- `name` (если есть)
- `isActive` (если есть)
- `email` (уникальный индекс, если есть)

## 🔗 Связанные файлы

- [`extract-interfaces.js`](./extract-interfaces.js) - Извлечение интерфейсов из Vue
- [`generate-sql-tables.js`](./generate-sql-tables.js) - Генерация SQL скриптов
- [`apply-migrations.js`](./apply-migrations.js) - Применение миграций
- [`extract-from-db.js`](./extract-from-db.js) - Извлечение из БД
- [`generate-models.js`](./generate-models.js) - Генерация моделей
- [`generate-controllers.js`](./generate-controllers.js) - Генерация контроллеров
- [`generate-routes.js`](./generate-routes.js) - Генерация роутов
- [`generate-vue-pages.js`](./generate-vue-pages.js) - Генерация Vue страниц
- [`generate-all.js`](./generate-all.js) - Мастер-скрипт

## 📚 Дополнительная документация

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - Детальная архитектура системы
- [`README.md`](./README.md) - Общая документация проекта

## 🎉 Результат

После выполнения всех шагов у вас будет:

1. ✅ Чистая БД с правильной структурой
2. ✅ Модели для всех сущностей
3. ✅ Контроллеры с полным CRUD
4. ✅ Роуты для всех API endpoints
5. ✅ Vue страницы с интеграцией API
6. ✅ Единая система без дублирования

Теперь можно запускать сервер и работать с приложением!

```bash
# Запуск backend сервера
cd backend
node server.js

# Запуск frontend (в другом терминале)
npm run dev
```
