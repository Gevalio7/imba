# Детальный план исправления системы гранулярных прав доступа

## Общее описание архитектуры

### Модель прав доступа (по аналогии с Linux)
- Каждый объект в системе имеет уровень доступа, выраженный в виде трехзначного числа (например, 777, 755, 644 и т.д.)
- Первая цифра - права владельца (владелец/создатель объекта)
- Вторая цифра - права группы (пользователи с определенной ролью)
- Третья цифра - права остальных пользователей
- Значения:
  - 7 = чтение + запись + удаление (rwx)
  - 6 = чтение + запись (rw-)
  - 5 = чтение + удаление (r-x)
  - 4 = только чтение (r--)
  - 3 = запись + удаление (-wx)
  - 2 = только запись (-w-)
  - 1 = только удаление (--x)
  - 0 = нет доступа (---)

### Правила отображения меню
- Если у пользователя есть право "чтение" (r) для объекта меню, то пункт меню отображается
- Если у пользователя есть право "запись" (w) для объекта меню, то доступны операции создания/редактирования
- Если у пользователя есть право "удаление" (x) для объекта меню, то доступны операции удаления

## Текущая ситуация и проблемы

### 1. Несоответствие разрешений в БД и API
#### Разрешения в БД, но отсутствующие в API:
- `menu_chat_read`
- `menu_chat_write` 
- `menu_chat_delete`
- `menu_agents_read`
- `menu_agents_write`

#### Разрешения в API, но отсутствующие в БД:
- `see_company_tickets`
- `manage_roles`
- `menu_tickets_list_*`
- `menu_tickets_create_*`
- `menu_tickets_schedules_*`

### 2. Проблемы с моделью Roles
- Метод `getAvailablePermissions()` возвращает только 25 базовых разрешений
- Отсутствуют разрешения для чата и агентов
- Нет механизма динамического получения всех разрешений из БД

### 3. Проблемы с ролью "Специалист" (ID=11)
- У роли нет разрешения `manage_roles`, необходимого для управления разрешениями
- В БД у роли только 3 разрешения: `menu_chat_delete`, `menu_chat_read`, `menu_chat_write` (все false)

### 4. Проблемы с интерфейсом редактирования ролей
- Не отображаются все разрешения, доступные в БД
- Некорректная работа методов установки разрешений
- Нет отображения числовых уровней доступа

## Цели реализации

1. **Полное соответствие разрешений в БД и API**
   - Все разрешения из БД должны быть доступны через API
   - Все разрешения из API должны существовать в БД

2. **Реализация модели Linux-подобных прав доступа**
   - Добавление числовых уровней доступа для каждого объекта
   - Визуализация этих уровней в интерфейсе

3. **Корректная работа интерфейса редактирования ролей**
   - Отображение всех доступных разрешений
   - Возможность установки прав по модели Linux
   - Корректное сохранение изменений

4. **Предоставление доступа пользователю Morozova**
   - Добавление необходимых разрешений для управления ролями

## Детальный план реализации

### Этап 1: Анализ текущей структуры БД

#### 1.1. Исследование таблицы `role_permissions`
```sql
-- Посмотреть все существующие разрешения в БД
SELECT DISTINCT permission FROM role_permissions ORDER BY permission;

-- Посмотреть разрешения, которые есть в БД, но отсутствуют в модели
SELECT DISTINCT permission FROM role_permissions 
WHERE permission NOT IN (
  'super_user', 'create_ticket', 'see_own_tickets', 'reply_to_tickets',
  'internal_notes', 'change_status', 'see_all_tickets', 'see_department_tickets',
  'see_company_tickets', 'kb_read', 'kb_write', 'view_reports',
  'system_settings', 'manage_users', 'menu_roles', 'manage_roles',
  'menu_tickets_list_read', 'menu_tickets_list_write', 'menu_tickets_list_delete',
  'menu_tickets_create_read', 'menu_tickets_create_write', 'menu_tickets_create_delete',
  'menu_tickets_schedules_read', 'menu_tickets_schedules_write', 'menu_tickets_schedules_delete'
);

-- Посмотреть использование разрешений по ролям
SELECT rp.permission, r.name as role_name, rp.is_granted 
FROM role_permissions rp 
JOIN roles r ON rp.role_id = r.id 
WHERE rp.permission LIKE 'menu_%' 
ORDER BY rp.permission, r.name;
```

#### 1.2. Исследование структуры разрешений
- Определить категории разрешений
- Определить типы разрешений (read/write/delete)
- Определить иерархию разрешений (родительские/дочерние)

### Этап 2: Модификация бэкенда

#### 2.1. Обновление модели Roles (`backend/models/roles.js`)

##### 2.1.1. Модификация метода `getAvailablePermissions()`
```javascript
// Получение всех разрешений, включая те, что есть в БД
static getAvailablePermissions() {
  return [
    // Супер-пользователь
    { code: 'super_user', name: 'Супер-пользователь (полный доступ)', category: 'admin', level: 777 },

    // Тикеты
    { code: 'create_ticket', name: 'Создание заявок', category: 'tickets', level: 644 },
    { code: 'see_own_tickets', name: 'Видеть только свои заявки', category: 'tickets', level: 444 },
    { code: 'reply_to_tickets', name: 'Отвечать на заявки', category: 'tickets', level: 644 },
    { code: 'internal_notes', name: 'Внутренние заметки', category: 'tickets', level: 644 },
    { code: 'change_status', name: 'Менять статус/приоритет', category: 'tickets', level: 644 },
    { code: 'see_all_tickets', name: 'Видеть все заявки', category: 'tickets', level: 444 },
    { code: 'see_department_tickets', name: 'Видеть заявки отдела', category: 'tickets', level: 444 },
    { code: 'see_company_tickets', name: 'Видеть заявки компании', category: 'tickets', level: 444 },

    // База знаний
    { code: 'kb_read', name: 'Доступ к БЗ (чтение)', category: 'knowledge_base', level: 444 },
    { code: 'kb_write', name: 'Доступ к БЗ (создание/редактирование)', category: 'knowledge_base', level: 644 },

    // Отчёты и настройки
    { code: 'view_reports', name: 'Просмотр отчётов', category: 'reports', level: 444 },
    { code: 'system_settings', name: 'Настройка системы', category: 'settings', level: 755 },
    { code: 'manage_users', name: 'Управление пользователями', category: 'settings', level: 755 },
    { code: 'menu_roles', name: 'Доступ к управлению ролями', category: 'settings', level: 444 },
    { code: 'manage_roles', name: 'Управление ролями и разрешениями', category: 'settings', level: 755 },

    // Menu permissions (для интерфейса ролей)
    { code: 'menu_tickets_list_read', name: 'Меню: Список обращений (чтение)', category: 'menu', level: 444 },
    { code: 'menu_tickets_list_write', name: 'Меню: Список обращений (запись)', category: 'menu', level: 644 },
    { code: 'menu_tickets_list_delete', name: 'Меню: Список обращений (удаление)', category: 'menu', level: 744 },
    { code: 'menu_tickets_create_read', name: 'Меню: Создать обращение (чтение)', category: 'menu', level: 444 },
    { code: 'menu_tickets_create_write', name: 'Меню: Создать обращение (запись)', category: 'menu', level: 644 },
    { code: 'menu_tickets_create_delete', name: 'Меню: Создать обращение (удаление)', category: 'menu', level: 744 },
    { code: 'menu_tickets_schedules_read', name: 'Меню: Расписания (чтение)', category: 'menu', level: 444 },
    { code: 'menu_tickets_schedules_write', name: 'Меню: Расписания (запись)', category: 'menu', level: 644 },
    { code: 'menu_tickets_schedules_delete', name: 'Меню: Расписания (удаление)', category: 'menu', level: 744 },
    
    // Добавить недостающие разрешения из БД
    { code: 'menu_chat_read', name: 'Меню: Чат (чтение)', category: 'menu', level: 444 },
    { code: 'menu_chat_write', name: 'Меню: Чат (запись)', category: 'menu', level: 644 },
    { code: 'menu_chat_delete', name: 'Меню: Чат (удаление)', category: 'menu', level: 744 },
    { code: 'menu_agents_read', name: 'Меню: Агенты (чтение)', category: 'menu', level: 444 },
    { code: 'menu_agents_write', name: 'Меню: Агенты (запись)', category: 'menu', level: 644 },
    
    // Добавить другие недостающие разрешения...
  ];
}
```

##### 2.1.2. Добавление метода получения всех разрешений из БД
```javascript
// Получение всех уникальных разрешений из БД
static async getAllDatabasePermissions() {
  try {
    const result = await pool.query('SELECT DISTINCT permission FROM role_permissions ORDER BY permission');
    return result.rows.map(row => row.permission);
  } catch (error) {
    console.error('Error getting database permissions:', error);
    return [];
  }
}
```

##### 2.1.3. Добавление метода синхронизации разрешений
```javascript
// Синхронизация разрешений модели с БД
static async syncPermissionsWithDatabase() {
  try {
    const dbPermissions = await this.getAllDatabasePermissions();
    const modelPermissions = this.getAvailablePermissions().map(p => p.code);
    
    // Найти разрешения, которые есть в БД, но отсутствуют в модели
    const missingInModel = dbPermissions.filter(p => !modelPermissions.includes(p));
    
    // Добавить недостающие разрешения в модель
    // ...
    
    return this.getAvailablePermissions();
  } catch (error) {
    console.error('Error syncing permissions:', error);
    return this.getAvailablePermissions();
  }
}
```

#### 2.2. Обновление контроллера Roles (`backend/controllers/rolesController.js`)

##### 2.2.1. Модификация метода `getAvailablePermissions`
```javascript
// Получить все доступные разрешения (включая те, что в БД)
const getAvailablePermissions = asyncHandler(async (req, res) => {
  try {
    // Синхронизировать разрешения модели с БД
    const permissions = await Roles.syncPermissionsWithDatabase();
    res.json({ permissions });
  } catch (error) {
    console.error('Error in getAvailablePermissions:', error);
    // В случае ошибки вернуть базовые разрешения
    const permissions = Roles.getAvailablePermissions();
    res.json({ permissions });
  }
});
```

##### 2.2.2. Обновление метода `getAllPermissionsWithDetails`
```javascript
// Получить все разрешения роли с деталями (обновленная версия)
static async getAllPermissionsWithDetails(roleId) {
  try {
    // Получаем все разрешения, которые есть в БД для данной роли
    const result = await pool.query(
      `SELECT permission, is_granted FROM role_permissions WHERE role_id = $1`,
      [roleId]
    );
    
    // Создаем объект разрешений
    const grantedPermissions = {};
    result.rows.forEach(row => {
      grantedPermissions[row.permission] = row.is_granted;
    });
    
    // Получаем все доступные разрешения (синхронизированные с БД)
    const availablePermissions = await this.syncPermissionsWithDatabase();
    
    // Создаем массив всех разрешений
    const allPermissions = [];
    
    // Добавляем доступные разрешения
    availablePermissions.forEach(p => {
      allPermissions.push({
        ...p,
        is_granted: grantedPermissions[p.code] || false
      });
    });
    
    // Добавляем разрешения для элементов меню из БД
    Object.keys(grantedPermissions).forEach(permission => {
      // Проверяем, есть ли уже такое разрешение в доступных
      const exists = availablePermissions.some(p => p.code === permission);
      
      if (!exists) {
        // Определяем тип разрешения по суффиксу
        let type = 'другое';
        let level = 0;
        if (permission.endsWith('_read')) {
          type = 'чтение';
          level = 444;
        } else if (permission.endsWith('_write')) {
          type = 'запись';
          level = 644;
        } else if (permission.endsWith('_delete')) {
          type = 'удаление';
          level = 744;
        }
        
        // Определяем категорию по префиксу
        let category = 'menu';
        if (permission.startsWith('menu_')) {
          category = 'menu';
        } else {
          // Пытаемся определить категорию по первой части кода
          const parts = permission.split('_');
          if (parts.length > 1) {
            category = parts[0];
          }
        }
        
        allPermissions.push({
          code: permission,
          name: permission,
          category: category,
          level: level,
          is_granted: grantedPermissions[permission]
        });
      }
    });
    
    return allPermissions;
  } catch (error) {
    console.error('Error in getAllPermissionsWithDetails:', error);
    throw error;
  }
}
```

#### 2.3. Обновление маршрутов (`backend/routes/roles.js`)
```javascript
// Добавить новый endpoint для получения разрешений с уровнями доступа
router.get('/permissions-with-levels', getAvailablePermissionsWithLevels);

// Модифицировать существующий endpoint
router.get('/permissions', getAvailablePermissions);
```

### Этап 3: Обновление базы данных

#### 3.1. Добавление недостающих разрешений для роли "Специалист"
```sql
-- Добавить разрешение manage_roles для роли "Специалист" (ID=11)
INSERT INTO role_permissions (role_id, permission, is_granted) 
SELECT 11, 'manage_roles', true
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE role_id = 11 AND permission = 'manage_roles'
);

-- Обновить существующие разрешения для роли "Специалист"
UPDATE role_permissions 
SET is_granted = true 
WHERE role_id = 11 
AND permission IN ('menu_chat_read', 'menu_chat_write', 'menu_chat_delete');

-- Добавить недостающие разрешения для чата и агентов
INSERT INTO role_permissions (role_id, permission, is_granted) 
VALUES 
  (11, 'menu_agents_read', true),
  (11, 'menu_agents_write', true)
ON CONFLICT (role_id, permission) 
DO UPDATE SET is_granted = EXCLUDED.is_granted;
```

#### 3.2. Создание таблицы для хранения уровней доступа (опционально)
```sql
-- Создание таблицы для хранения числовых уровней доступа
CREATE TABLE IF NOT EXISTS permission_levels (
  id SERIAL PRIMARY KEY,
  permission_code VARCHAR(100) UNIQUE NOT NULL,
  owner_level INTEGER DEFAULT 7,  -- 0-7
  group_level INTEGER DEFAULT 5,  -- 0-7
  other_level INTEGER DEFAULT 4,  -- 0-7
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавить столбец level в таблицу role_permissions (если нужно)
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS level INTEGER;
```

### Этап 4: Обновление фронтенда

#### 4.1. Обновление интерфейса редактирования ролей (`src/pages/apps/roles/edit.vue`)

##### 4.1.1. Добавление отображения уровней доступа
```vue
<!-- Добавить отображение числового уровня доступа -->
<div class="permission-level-display">
  <span class="level-badge">{{ getPermissionLevel(permission) }}</span>
  <span class="level-description">{{ getLevelDescription(getPermissionLevel(permission)) }}</span>
</div>

<script>
// Добавить методы для работы с уровнями доступа
const getPermissionLevel = (permission) => {
  // Вернуть числовой уровень доступа для разрешения
  return permission.level || 444;
};

const getLevelDescription = (level) => {
  // Вернуть текстовое описание уровня доступа
  const descriptions = {
    777: 'Полный доступ (чтение/запись/удаление)',
    644: 'Чтение и запись',
    444: 'Только чтение',
    755: 'Полный доступ для владельца, чтение для других',
    0: 'Нет доступа'
  };
  return descriptions[level] || 'Уровень доступа не определен';
};

// Добавить метод для установки уровня доступа
const setPermissionLevel = async (permissionCode, level) => {
  // Установить числовой уровень доступа для разрешения
  try {
    await $api(`/roles/${roleId.value}/permissions-level`, {
      method: 'PUT',
      body: { permission: permissionCode, level: level }
    });
    
    // Обновить локальное состояние
    const permission = permissionsMap.value.get(permissionCode);
    if (permission) {
      permission.level = level;
    }
    
    showToast('Уровень доступа успешно обновлен');
  } catch (err) {
    console.error('Failed to update permission level:', err);
    showToast('Ошибка обновления уровня доступа', 'error');
  }
};
</script>
```

##### 4.1.2. Обновление метода загрузки разрешений
```javascript
const fetchPermissions = async () => {
  try {
    // Загрузить разрешения с уровнями доступа
    const data = await $api<{ permissions: Permission[] }>('/roles/permissions-with-levels');
    
    console.log('Loaded permissions with levels from API:', data.permissions.length);
    
    // Заполнить Map с учетом уровней доступа
    data.permissions.forEach(perm => {
      permissionsMap.value.set(perm.code, {
        code: perm.code,
        name: perm.name,
        category: perm.category,
        level: perm.level || 444,
        read: perm.code.endsWith('_read') ? (perm as any).is_granted === true : false,
        write: perm.code.endsWith('_write') ? (perm as any).is_granted === true : false,
        delete: perm.code.endsWith('_delete') ? (perm as any).is_granted === true : false
      });
    });
    
    // ... остальная логика
  } catch (err) {
    console.error('Error fetching permissions:', err);
  }
};
```

##### 4.1.3. Добавление компонента выбора уровня доступа
```vue
<!-- Компонент выбора уровня доступа -->
<VSelect
  v-model="selectedLevel"
  :items="accessLevels"
  :label="`Уровень доступа: ${selectedLevel}`"
  @update:model-value="updatePermissionLevel"
>
  <template #selection="{ item }">
    <div class="d-flex align-center">
      <span class="mr-2">{{ item.raw.level }}</span>
      <span class="text-caption">{{ item.raw.description }}</span>
    </div>
  </template>
  <template #item="{ props, item }">
    <VListItem v-bind="props">
      <template #title>
        <div class="d-flex align-center">
          <span class="mr-2">{{ item.raw.level }}</span>
          <span>{{ item.raw.description }}</span>
        </div>
      </template>
    </VListItem>
  </template>
</VSelect>

<script>
const accessLevels = [
  { level: '777', description: 'Полный доступ (чтение/запись/удаление)' },
  { level: '644', description: 'Чтение и запись' },
  { level: '444', description: 'Только чтение' },
  { level: '755', description: 'Полный доступ для владельца, чтение для других' },
  { level: '0', description: 'Нет доступа' }
];

const selectedLevel = ref('444');

const updatePermissionLevel = (level) => {
  // Обновить уровень доступа для текущего разрешения
  console.log(`Setting permission level to: ${level}`);
};
</script>
```

### Этап 5: Тестирование и проверка

#### 5.1. Проверка API endpoints
```bash
# Проверить, что /roles/permissions возвращает все разрешения
curl -s http://localhost:3000/api/roles/permissions | jq '.permissions | length'

# Проверить, что /roles/permissions-with-levels возвращает разрешения с уровнями
curl -s http://localhost:3000/api/roles/permissions-with-levels | jq '.permissions[0]'

# Проверить разрешения для роли "Специалист"
curl -s http://localhost:3000/api/roles/11/permissions | jq '.permissions | map(select(.is_granted==true))'
```

#### 5.2. Проверка в интерфейсе
1. Открыть интерфейс редактирования роли "Специалист"
2. Убедиться, что отображаются все разрешения из БД
3. Проверить отображение числовых уровней доступа
4. Проверить возможность установки уровней доступа
5. Проверить сохранение изменений

#### 5.3. Проверка доступа пользователя Morozova
1. Войти под пользователем Morozova
2. Перейти к управлению ролями
3. Убедиться, что есть доступ к редактированию разрешений
4. Проверить возможность сохранения изменений

### Этап 6: Документация и обучение

#### 6.1. Создание документации по уровням доступа
- Описание модели Linux-подобных прав доступа
- Таблица соответствия числовых уровней функциональным правам
- Примеры использования уровней доступа

#### 6.2. Создание руководства для администраторов
- Как использовать интерфейс редактирования ролей
- Как устанавливать уровни доступа
- Как проверять права доступа пользователей

#### 6.3. Создание примеров конфигураций
- Рекомендуемые уровни доступа для различных ролей
- Примеры настройки прав для отделов и групп
- Шаблоны конфигураций для типичных сценариев использования

## Риски и меры по их минимизации

### 1. Потеря данных при обновлении БД
**Мера:** Создать резервную копию БД перед внесением изменений

### 2. Нарушение обратной совместимости
**Мера:** Обеспечить постепенное обновление с сохранением существующего функционала

### 3. Проблемы с производительностью при большом количестве разрешений
**Мера:** Оптимизировать запросы к БД и кэшировать часто используемые данные

### 4. Ошибки в интерфейсе при отображении уровней доступа
**Мера:** Тщательное тестирование всех сценариев отображения и взаимодействия

## Критерии успешного завершения

1. **Полное соответствие разрешений в БД и API**
   - Все разрешения из БД доступны через API
   - Все разрешения из API существуют в БД

2. **Корректная работа интерфейса редактирования ролей**
   - Отображаются все доступные разрешения
   - Корректно работают чекбоксы установки прав
   - Отображаются числовые уровни доступа

3. **Доступ пользователя Morozova к управлению разрешениями**
   - Пользователь может войти в систему
   - Пользователь имеет доступ к управлению ролями
   - Пользователь может изменять разрешения через интерфейс

4. **Работоспособность системы прав по модели Linux**
   - Числовые уровни доступа корректно отображаются
   - Права применяются согласно установленным уровням
   - Система меню корректно реагирует на права доступа

## Временные рамки реализации

### Неделя 1: Анализ и проектирование
- Анализ текущей структуры БД
- Проектирование модели уровней доступа
- Создание технической документации

### Неделя 2: Реализация бэкенда
- Обновление модели Roles
- Обновление контроллера Roles
- Обновление маршрутов
- Обновление БД

### Неделя 3: Реализация фронтенда
- Обновление интерфейса редактирования ролей
- Добавление отображения уровней доступа
- Тестирование функциональности

### Неделя 4: Тестирование и доработка
- Комплексное тестирование
- Исправление выявленных проблем
- Создание документации

## Необходимые ресурсы

1. **Человеческие ресурсы:**
   - Backend разработчик (1 человек)
   - Frontend разработчик (1 человек)
   - Тестировщик (0.5 человека)
   - Технический писатель (0.25 человека)

2. **Технические ресурсы:**
   - Доступ к серверу разработки
   - Доступ к БД
   - Инструменты разработки (IDE, Git, etc.)

3. **Временные ресурсы:**
   - 4 недели на реализацию
   - 1 неделя на тестирование и доработку