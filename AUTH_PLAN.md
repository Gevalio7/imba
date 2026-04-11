# План устранения проблемы авторизации

## Проблема
При PUT/POST/DELETE запросах с фронтенда ошибка "Не авторизован, токен отсутствует"
- Причина: не везде передается заголовок Authorization с токеном

## Решение

### Этап 1: Backend - добавить protect middleware

Добавить `protect` middleware для POST/PUT/DELETE эндпоинтов (для ролевой модели):

| Файл | Методы | Файл | Методы |
|------|--------|------|--------|
| states.js | POST/PUT/DELETE | services.js | все |
| signatures.js | все | queues.js | все |
| types.js | все | workflows.js | все |
| templates.js | все | roles.js | все |
| priorities.js | все | customers.js | все |
| customersGroups.js | все | customerUsers.js | все |
| emailAddresses.js | все | autoResponses.js | все |
| calendars.js | все | greetings.js | все |
| attachments.js | все | sla.js | все |
| sessionManagement.js | все | systemLog.js | все |
| knowledge-base.js | все | integrity.js | POST |
| ticketComments.js | все | ticketSchedules.js | все |
| и др. | | | |

### Этап 2: Frontend - использовать $api

Заменить `$fetch` на `$api` (автоматически добавляет токен):

**PUT запросы (~59 мест):**
- src/pages/apps/States.vue:71
- src/pages/apps/Signatures.vue:70
- src/pages/apps/Services.vue:129
- src/pages/apps/QueuesAddEdit.vue:266,272
- src/pages/apps/Types.vue:186,715
- src/pages/apps/Workflows.vue:216,289,338,342,359,363
- src/pages/apps/Templates.vue:62
- src/pages/apps/Roles.vue:75
- src/pages/apps/Priorities.vue:69
- src/pages/apps/Customers.vue:111
- src/pages/apps/CustomersGroups.vue:101
- src/pages/apps/CustomerUsers.vue:133
- src/pages/apps/EmailAddresses.vue:97
- src/pages/apps/AutoResponses.vue:64
- src/pages/apps/Calendars.vue:69
- src/pages/apps/Greetings.vue:63
- src/pages/apps/SLA.vue:107
- src/pages/apps/Attachments.vue:80
- src/pages/apps/Queues.vue:138
- src/pages/apps/SessionManagement.vue:65
- src/pages/apps/SystemLog.vue:62
- src/pages/apps/OrganizationStructure.vue:124,171,218,254
- src/pages/apps/PostMasterMailAccounts.vue:128
- src/pages/apps/TemplateQueues.vue:208,257
- src/pages/apps/tickets/Schedules.vue:236,252
- src/pages/apps/tickets/edit.vue:1254,1645
- src/pages/apps/Agents/edit.vue:265
- src/pages/apps/Agents/index.vue:183,251
- src/pages/apps/Agents/add.vue:199,207
- src/pages/apps/AgentsGroups.vue:180,251
- src/views/apps/roles/RolePermissions.vue:79
- src/views/apps/groups/AddEditGroupDialog.vue:150
- src/views/apps/groups/RolesTable.vue:61
- src/views/apps/groups/AgentsGroupsTable.vue:168
- src/views/apps/groups/AgentsTable.vue:212,718,753
- src/views/apps/knowledge-base/edit.vue:122
- src/pages/apps/settings/ticket-settings/SystemConfiguration.vue:65
- src/pages/apps/kanban/index.vue:27,46,68,76

**POST запросы:**
- src/pages/apps/IntegrityCheck.vue:65,82

**DELETE запросы:**
- src/views/apps/groups/AgentsTable.vue:238
- src/pages/apps/knowledge-base/index.vue:157
- src/pages/apps/Agents/index.vue:159,235
- src/pages/apps/AgentsGroups.vue:156,232

### Варианты реализации

**Вариант А (быстрый):**
1. Только frontend - заменить все $fetch на $api
2. Проверить работу

**Вариант Б (правильный):**
1. Backend - добавить protect на все изменяющие endpoints
2. Frontend - заменить $fetch на $api
3. Проверить работу

### Выполнено
- src/pages/apps/Agents/edit.vue:264 - changePassword - ДОБАВЛЕН токен