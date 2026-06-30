# Оставшиеся замечания и планы по рефакторингу

> Файл создан 30 июня 2026. Содержит все замечания, которые не были исправлены в ходе рефакторинга.
> Обновлён: 30 июня 2026, ~22:00 MSK

---

## 🔴 Высокий приоритет

### 1. Применить EntityList ко всем страницам, использующим useEntityCrud

**Статус:** 🟡 Выполнено частично (13/19)

`<EntityList>` — компонент-обёртка над `useEntityCrud`, заменяющий ~300–500 строк шаблонного UI (VCard, VDataTable, пагинация, диалоги, тулбар) на один компонент с кастомизацией через слоты.

#### ✅ Мигрировано на EntityList (11 страниц)

| Страница | Было | Стало | Кастомные фичи |
|----------|------|-------|----------------|
| States.vue | ~356 | ~90 | filterCallback (`selectedNames`), `#item.color`, `#edit-form` |
| Priorities.vue | ~370 | ~120 | filterCallback, `#item.color`, `#edit-form` |
| Greetings.vue | ~310 | ~90 | TiptapEditor, `#item.content` (stripHtmlTags) |
| Signatures.vue | ~340 | ~115 | filterCallback, TiptapEditor, `#item.content` |
| Calendars.vue | ~460 | ~140 | Дата-конвертация, color picker, широкая форма |
| **TypeCategories.vue** | ~210 | ~110 | filterCallback, кастомная форма |
| **AutoResponses.vue** | ~360 | ~100 | Чистый EntityList |
| **Customers.vue** | ~440 | ~105 | `customFilter` (поиск по 4 полям) |
| **CustomersGroups.vue** | ~400 | ~105 | `#item.customer`, загрузка справочника |
| **EmailAddresses.vue** | ~410 | ~100 | `#item.queueId`, загрузка очередей |
| **SLA.vue** | ~580 | ~120 | Широкая форма, загрузка calendars/services |
| **Services.vue** | ~800 | ~270 | filterCallback (names+types), кастомный save/edit, file upload |
| **Templates.vue** | ~520 | ~80 | TemplateEditorDialog интеграция |
| **Queues.vue** | ~620 | ~250 | Динамические колонки, навигация, ~20 слотов справочников |

#### ❌ Пропущены (сложные для EntityList)

| Страница | Причина |
|----------|---------|
| **Types.vue** | Кастомный endpoint `/typeCategories/with-types`, аккордеон с CRUD категорий, category-type связи |
| **Attachments.vue** | File upload через FormData — несовместимо с JSON-сохранением useEntityCrud |

#### ⏳ Ещё не мигрированы (2 страницы)

| Страница | Сложность | Особенности |
|----------|-----------|-------------|
| **TemplateQueues.vue** | Сложная | Два useEntityCrud на одной странице |
| **Workflows.vue** | Сложная | Визуальный редактор + список воркфлоу |

#### ❌ Не подходят под EntityList (сложные/не-CRUD страницы)

| Страница | Причина |
|----------|---------|
| Backup.vue | Не CRUD |
| IntegrityCheck.vue | Не CRUD |
| QueuesAddEdit.vue | Add/Edit, не список |
| Roles.vue | Кастомные permission-деревья |
| OrganizationStructure.vue | Кастомная структура |
| chat.vue | Чат |
| tickets/ (index, view, add, edit, Schedules) | Сложный ticket management |
| knowledge-base/ | Кастомные карточки + редактор |
| permissions/ | Кастомный UI |
| CustomerUsers.vue | Сложный (связи с customers) |
| PostMasterMailAccounts/ | Кастомные страницы |
| Agents/ (index, edit, add) | Сложный agents management |
| AgentsGroups.vue | Сложные группы агентов |
| roles/ (edit, components) | Кастомный редактор ролей |
| SessionManagement.vue | Не CRUD (управление сессиями) |
| SystemLog.vue | Логи (только чтение) |
| kanban/ | Канбан-доска |

---

### 2. ~~Исправить `selectedItems: any[]` на конкретные типы~~ ✅

**Сделано (8 файлов, июнь 2026):**
- `useEntityCrud.ts` — `ref([]) as Ref<T[]>` вместо `as any`
- 7 страниц: PostMasterMailAccounts/index, tickets/index, SystemLog, SessionManagement, Roles, SystemConfiguration, RolesTable

---

### 3. Типизировать useReferenceData.ts

**Проблема:** Все поля в `useReferenceData.ts` имеют тип `any[]`:
```ts
priorities: ref<any[]>([])
queues: ref<any[]>([])
states: ref<any[]>([])
// ... итого ~15 полей
```

**Решение:** Создать отдельный файл с интерфейсами и использовать конкретные типы.

---

### 3.1. ⚠️ Производительность useReferenceData

**Проблема:** Кэш отключён (TTL = 30 сек — мало) — каждый переход на страницу перезагружает все справочники заново. Страницы тормозят.

**Нужно:** Добавить кэширование (localStorage или in-memory TTL ≥ 5 мин) или единый endpoint `/reference-data`.

**Заметка пользователя:** «Я отказался от кэширования, но страницы тормозят»

---

### 4. Стандартизовать API-клиент

**Проблема:** Часть файлов использует `$api`, часть — прямой `$fetch` (tickets/*.vue).

---

## 🟡 Средний приоритет

### 5. Стандартизовать утилиты
Функции `formatDate`, `resolveStatusVariant`, `getOwnerName` дублируются.

### 6. Предсуществующие баги
- knowledge-base/index.vue: дублирующиеся кнопки удаления, `useGenerateImageVariant` может не автоимпортироваться

### 7. Удалить дублирующиеся компоненты
- `pages/apps/Roles.vue` и `views/apps/groups/RolesTable.vue`
- `pages/apps/AgentsGroups.vue` и `views/apps/groups/AgentsGroupsTable.vue`
- `pages/apps/Agents/index.vue` и `views/apps/groups/AgentsTable.vue`

### 8. Разделить backend/server.ts
Один файл на 300+ строк (сервер, роуты, планировщик, бэкапы).

---

## 🟢 Низкий приоритет

### 9. Единый формат даты
### 10. Удалить `any` касты в composables (`useCookie<any>('userData')`)
### 11. Проверить импорты auto-imports

---

## ✅ Выполненные рефакторинги

- ✅ **Toast notification system** — июнь 2026 (3 коммита, -958 строк)
- ✅ **useEntityCrud composable** — создан (июнь 2026)
- ✅ **EntityList.vue компонент** — создан (июнь 2026, 676 строк)
- ✅ **Мигрировано на EntityList (11):** States, Priorities, Greetings, Signatures, Calendars, **TypeCategories, AutoResponses, Customers, CustomersGroups, EmailAddresses, SLA, Services, Templates, Queues**
- ✅ **`selectedItems` типизированы** — 8 файлов
- ✅ **`filterCallback` добавлен в useEntityCrud**
- ✅ **`filterCallback` на Services** — двойная фильтрация по names + types

---

## 📊 Сводка (imba/ директория)

| Категория | Количество | Статус |
|-----------|-----------|--------|
| Всего страниц CRUD-типа | ~30 | — |
| Мигрировано на EntityList | 11 | ✅ |
| Пропущено (сложные) | 2 (Types, Attachments) | ❌ |
| Осталось мигрировать | 2 (TemplateQueues, Workflows) | 🟡 |
| Не CRUD / сложные | ~15 | ❌ |
| `selectedItems` без `any` | все | ✅ |
| `useReferenceData` типизирован | 0 | ❌ |
| `useReferenceData` производительность | ❌ | ⚠️ |
