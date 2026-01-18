# Архитектура системы генерации кода

## 📋 Обзор

Система автоматической генерации кода для полного стека (Frontend Vue + Backend Node.js/Express + PostgreSQL).

## 🔄 Поток работы

```
Vue файлы (интерфейсы) 
    ↓
extract-interfaces.js → extracted-interfaces.json
    ↓
generate-models.js → models/*.js
    ↓
generate-controllers.js → controllers/*.js
    ↓
generate-routes.js → routes/*.js
    ↓
generate-vue-pages.js → обновление Vue страниц с API
```

## 📁 Структура файлов

### Генераторы (backend/)

1. **extract-interfaces.js** - Извлекает TypeScript интерфейсы из Vue файлов
2. **extract-from-db.js** - Извлекает структуру из существующей БД
3. **generate-models.js** - Генерирует модели для работы с БД
4. **generate-controllers.js** - Генерирует контроллеры с CRUD операциями
5. **generate-routes.js** - Генерирует Express роуты
6. **generate-vue-pages.js** - Генерирует/обновляет Vue страницы с API интеграцией
7. **generate-all.js** - Мастер-скрипт для запуска всех генераторов

### Конфигурация

- **extracted-interfaces.json** - Промежуточный файл с извлеченными интерфейсами
- **entities-config.json** - Конфигурация сущностей (обновляется автоматически)

## 🔧 Проблема с полями status и isActive

### Текущая ситуация

В `extracted-interfaces.json` присутствуют оба поля:
```json
{
  "status": "number // 1 - активен, 2 - не активен",
  "isActive": "boolean"
}
```

### Проблема

- **status** - числовое поле (1 = активен, 2 = не активен)
- **isActive** - булево поле (true/false)
- Это **дублирование** одной и той же информации
- На фронте используется `isActive` для отображения переключателя
- В БД хранятся оба поля, что избыточно

### Рекомендуемое решение

#### Вариант 1: Использовать только isActive (РЕКОМЕНДУЕТСЯ)

**Преимущества:**
- Простота и ясность
- Меньше места в БД
- Нет дублирования логики
- Boolean более понятен для разработчиков

**Изменения:**

1. В БД оставить только `is_active BOOLEAN`
2. Удалить поле `status` из всех таблиц
3. Обновить модели, контроллеры и Vue компоненты

#### Вариант 2: Использовать только status с enum

**Преимущества:**
- Возможность расширения (добавить статусы: архивный, на модерации и т.д.)
- Более гибкая система

**Недостатки:**
- Сложнее для простых случаев
- Требует маппинга на фронте

#### Вариант 3: Вычисляемое поле (текущий подход)

**Как работает сейчас:**
- В БД хранятся оба поля
- `isActive` вычисляется из `status`: `isActive = (status === 1)`
- При изменении `isActive` обновляется `status`

**Проблемы:**
- Избыточность данных
- Риск рассинхронизации
- Дополнительная логика синхронизации

## 🎯 Рекомендации по улучшению

### 1. Унификация полей статуса

Выберите один из вариантов и примените ко всем сущностям:

```javascript
// Вариант 1: Только isActive
interface Entity {
  id: number
  name: string
  isActive: boolean  // true = активен, false = не активен
  createdAt: string
  updatedAt: string
}

// Вариант 2: Только status с enum
interface Entity {
  id: number
  name: string
  status: EntityStatus  // enum: ACTIVE = 1, INACTIVE = 2, ARCHIVED = 3
  createdAt: string
  updatedAt: string
}

enum EntityStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  ARCHIVED = 3
}
```

### 2. Улучшение extract-interfaces.js

Добавить опцию для выбора стратегии статуса:

```javascript
// В начале файла
const STATUS_STRATEGY = process.env.STATUS_STRATEGY || 'isActive'; // 'isActive' | 'status' | 'both'

function normalizeStatusFields(fields) {
  if (STATUS_STRATEGY === 'isActive') {
    // Удаляем status, оставляем только isActive
    delete fields.status;
  } else if (STATUS_STRATEGY === 'status') {
    // Удаляем isActive, оставляем только status
    delete fields.isActive;
  }
  // 'both' - оставляем оба поля
  return fields;
}
```

### 3. Добавить скрипт миграции

Создать `backend/migrate-status-fields.js` для миграции существующих данных:

```javascript
// Миграция с двух полей на одно
async function migrateToIsActiveOnly() {
  const tables = await getAllTables();
  
  for (const table of tables) {
    // Синхронизируем данные
    await pool.query(`
      UPDATE ${table} 
      SET is_active = (status = 1)
      WHERE is_active != (status = 1)
    `);
    
    // Удаляем колонку status
    await pool.query(`
      ALTER TABLE ${table} 
      DROP COLUMN IF EXISTS status
    `);
  }
}
```

### 4. Улучшение генераторов

#### generate-models.js

Добавить поддержку виртуальных полей:

```javascript
// Если используем только isActive, но нужен status для обратной совместимости
static async getAll(options = {}) {
  const result = await pool.query(query, params);
  
  // Добавляем виртуальное поле status
  result.rows = result.rows.map(row => ({
    ...row,
    status: row.isActive ? 1 : 2  // виртуальное поле
  }));
  
  return result;
}
```

#### generate-controllers.js

Добавить валидацию и нормализацию:

```javascript
const create${entity} = asyncHandler(async (req, res) => {
  const data = normalizeStatusData(req.body);
  
  // Валидация
  if (!data.name?.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  const result = await ${entity}.create(data);
  res.status(201).json(result);
});

function normalizeStatusData(body) {
  const data = { ...body };
  
  // Если передан status, конвертируем в isActive
  if (data.status !== undefined) {
    data.isActive = data.status === 1;
    delete data.status;
  }
  
  // Если не передан isActive, ставим true по умолчанию
  if (data.isActive === undefined) {
    data.isActive = true;
  }
  
  return data;
}
```

### 5. Улучшение generate-vue-pages.js

Упростить логику переключения статуса:

```vue
<!-- Вместо сложной логики с двумя полями -->
<VSwitch
  :model-value="item.isActive"
  @update:model-value="(val) => toggleStatus(item, val)"
/>

<script>
const toggleStatus = async (item: Entity, newValue: boolean) => {
  try {
    await updateEntity(item.id, {
      ...item,
      isActive: newValue
    })
    showToast('Статус изменен')
  } catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}
</script>
```

### 6. Добавить генератор SQL миграций

Создать `backend/generate-migrations.js`:

```javascript
function generateCreateTableSQL(entityName, fields) {
  const tableName = toSnakeCase(entityName);
  
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  sql += `  id SERIAL PRIMARY KEY,\n`;
  
  for (const [fieldName, fieldType] of Object.entries(fields)) {
    const columnName = toSnakeCase(fieldName);
    const sqlType = mapTypeToSQL(fieldType);
    const nullable = isFieldRequired(fieldName) ? 'NOT NULL' : '';
    
    sql += `  ${columnName} ${sqlType} ${nullable},\n`;
  }
  
  sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
  sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
  sql += `);\n`;
  
  return sql;
}
```

### 7. Добавить тесты

Создать `backend/tests/generators.test.js`:

```javascript
describe('Generators', () => {
  test('extract-interfaces should parse Vue files correctly', () => {
    const content = `
      interface SLA {
        name: string
        isActive: boolean
      }
    `;
    
    const result = extractInterfaces(content);
    expect(result).toHaveProperty('SLA');
    expect(result.SLA).toHaveProperty('name', 'string');
    expect(result.SLA).toHaveProperty('isActive', 'boolean');
  });
  
  test('should not duplicate status fields', () => {
    const fields = {
      name: 'string',
      status: 'number',
      isActive: 'boolean'
    };
    
    const normalized = normalizeStatusFields(fields);
    expect(normalized).not.toHaveProperty('status');
    expect(normalized).toHaveProperty('isActive');
  });
});
```

## 🚀 План внедрения улучшений

### Этап 1: Анализ (1 день)
- [ ] Проверить все таблицы в БД
- [ ] Определить, какие сущности используют status/isActive
- [ ] Выбрать стратегию (рекомендуется: только isActive)

### Этап 2: Подготовка (1 день)
- [ ] Создать резервную копию БД
- [ ] Написать скрипт миграции
- [ ] Протестировать на тестовой БД

### Этап 3: Обновление генераторов (2 дня)
- [ ] Обновить extract-interfaces.js
- [ ] Обновить generate-models.js
- [ ] Обновить generate-controllers.js
- [ ] Обновить generate-vue-pages.js

### Этап 4: Миграция (1 день)
- [ ] Запустить миграцию БД
- [ ] Перегенерировать все файлы
- [ ] Проверить работоспособность

### Этап 5: Тестирование (2 дня)
- [ ] Написать unit-тесты
- [ ] Провести интеграционное тестирование
- [ ] Проверить все CRUD операции

## 📊 Метрики качества

После внедрения улучшений:

- ✅ Уменьшение размера БД на ~10-15%
- ✅ Упрощение кода на ~20%
- ✅ Устранение риска рассинхронизации данных
- ✅ Улучшение читаемости кода
- ✅ Ускорение разработки новых сущностей

## 🔗 Связанные файлы

- [`extract-interfaces.js`](./extract-interfaces.js) - Извлечение интерфейсов
- [`generate-models.js`](./generate-models.js) - Генерация моделей
- [`generate-controllers.js`](./generate-controllers.js) - Генерация контроллеров
- [`generate-routes.js`](./generate-routes.js) - Генерация роутов
- [`generate-vue-pages.js`](./generate-vue-pages.js) - Генерация Vue страниц
- [`generate-all.js`](./generate-all.js) - Мастер-скрипт

## 📝 Примечания

1. Всегда делайте резервную копию БД перед миграцией
2. Тестируйте изменения на dev-окружении
3. Документируйте все изменения в CHANGELOG.md
4. Обновляйте API документацию после изменений
