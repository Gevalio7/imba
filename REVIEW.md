# Оставшиеся замечания и планы по рефакторингу

> Файл создан 30 июня 2026. Содержит все замечания, которые не были исправлены в ходе рефакторинга тостов.

---

## 🔴 Высокий приоритет

### 1. Создать useEntityCrud composable (Generic CRUD)
**Проблема:** Большинство страниц админки (States, Priorities, Types, TypeCategories, Queues, SLA, Greetings, Signatures, Attachments, Customers, CustomersGroups, EmailAddresses, Backup, Services, IntegrityCheck, AutoResponses, Templates и др.) — это огромные файлы по 600–1300 строк с идентичными CRUD-операциями:
- `fetchItems()`, `createItem()`, `updateItem()`, `deleteItem()`
- `confirmBulkDelete()`, `confirmBulkStatusChange()`
- `resolveStatusVariant()`, `toggleStatus()`
- Пагинация, диалоги фильтра, диалоги удаления
- Массовые действия (selectedItems, bulkDelete, bulkChangeStatus)

**Решение:** Создать `useEntityCrud<T>(endpoint, config)` composable + переиспользуемый `<EntityList>` компонент.

**Файлы для изменения:** ~30 страниц в `imba/src/pages/apps/`

---

### 2. Исправить типы `any` в selectedItems
**Проблема:** В 20+ файлах используется `selectedItems = ref<any[]>([])` вместо типизированной версии:
- `imba/src/pages/apps/Agents/index.vue`
- `imba/src/pages/apps/States.vue`
- `imba/src/pages/apps/Priorities.vue`
- `imba/src/pages/apps/Types.vue`
- `imba/src/pages/apps/TypeCategories.vue`
- `imba/src/pages/apps/Queues.vue`
- `imba/src/pages/apps/Roles.vue`
- `imba/src/pages/apps/SLA.vue`
- `imba/src/pages/apps/Greetings.vue`
- `imba/src/pages/apps/Signatures.vue`
- `imba/src/pages/apps/Attachments.vue`
- `imba/src/pages/apps/Customers.vue`
- `imba/src/pages/apps/CustomersGroups.vue`
- `imba/src/pages/apps/EmailAddresses.vue`
- `imba/src/pages/apps/Backup.vue`
- `imba/src/pages/apps/Services.vue`
- `imba/src/pages/apps/IntegrityCheck.vue`
- `imba/src/pages/apps/AutoResponses.vue`
- `imba/src/pages/apps/Templates.vue`
- `imba/src/pages/apps/TemplateQueues.vue`
- `imba/src/pages/apps/Workflows.vue`
- `imba/src/pages/apps/Calendars.vue`

**Решение:** Заменить на `ref<EntityType[]>([])` с конкретным интерфейсом.

---

### 3. Типизировать useReferenceData.ts
**Проблема:** Все поля в `useReferenceData.ts` имеют тип `any[]`:
```ts
priorities: ref<any[]>([])
queues: ref<any[]>([])
states: ref<any[]>([])
types: ref<any[]>([])
// ... итого ~20 полей
```

**Решение:** Создать отдельный файл с интерфейсами и использовать конкретные типы.

---

### 4. Стандартизовать API-клиент
**Проблема:** Некоторые файлы используют `$api` (из `utils/api.ts`), другие — `$fetch` напрямую, третьи используют `useApi` composable. Надо везде использовать единый клиент.

**Файлы с прямым `$fetch`:**
- `imba/src/pages/apps/tickets/*.vue` — используют `import.meta.env.VITE_API_BASE_URL` напрямую

**Решение:** Провести единообразное использование `$api` во всех файлах.

---

## 🟡 Средний приоритет

### 5. Стандартизовать утилиты
**Проблема:** Функции вроде `formatDate`, `resolveStatusVariant`, `getOwnerName` дублируются во многих страницах. Нужно вынести в общие утилиты.

---

### 6. Предсуществующие баги (не связаны с рефакторингом)
- **knowledge-base/index.vue**: Дублирующиеся кнопки удаления в карточках популярных статей (вторая без проверки прав `$can`)
- **knowledge-base/index.vue**: Использует `useGenerateImageVariant` из auto-imports (возможно, больше не автоимпортируется)

---

### 7. Удалить дублирующиеся компоненты и страницы
**Проблема:** В `imba/src/pages/apps/` и `imba/src/views/apps/` есть дублирующиеся или пересекающиеся компоненты. Например:
- `pages/apps/Roles.vue` и `views/apps/groups/RolesTable.vue`
- `pages/apps/AgentsGroups.vue` и `views/apps/groups/AgentsGroupsTable.vue`
- `pages/apps/Agents/index.vue` и `views/apps/groups/AgentsTable.vue`

**Решение:** Проанализировать, какие страницы используются, и удалить дубли.

---

### 8. Разделить backend/server.ts
**Проблема:** Один файл на 300+ строк, где смешаны настройка сервера, роуты, планировщик задач и бэкапы.

**Решение:** Разделить на модули (routes/, scheduler/, backup/).

---

### 9. useReferenceData кеш
**Проблема:** Кеш на 30 секунд, но много страниц всё равно загружает данные отдельно, а не через него.

**Решение:** Увеличить время кеша и убедиться, что все компоненты используют `useReferenceData`.

---

## 🟢 Низкий приоритет / Косметика

### 10. Везде использовать единый формат даты
Разные страницы форматируют даты по-разному. Нужна единая утилита.

### 11. Удалить `any` касты в composables
Например `useCookie<any>('userData')` — нужно типизировать.

### 12. Проверить импорты auto-imports
Многие функции больше не автоимпортируются (см. git-diff в начале). Нужно добавить явные импорты.

---

## ✅ Выполненные рефакторинги
- ✅ **Toast notification system** — июнь 2026 (3 коммита, ~50+ файлов, -958 строк)
