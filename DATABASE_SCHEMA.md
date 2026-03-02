# Описание структуры базы данных

## Общая информация

- **СУБД:** PostgreSQL
- **Всего таблиц:** 60+
- **Расширение:** uuid-ossp

---

## Основные таблицы

### 1. Пользователи и аутентификация

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| users | id | SERIAL | Уникальный идентификатор |
| users | login | VARCHAR(255) | Логин пользователя (уникальный) |
| users | password | VARCHAR(255) | Хэш пароля |
| users | first_name | VARCHAR(255) | Имя |
| users | last_name | VARCHAR(255) | Фамилия |
| users | email | VARCHAR(255) | Email (уникальный) |
| users | is_active | BOOLEAN | Активность пользователя |
| users | created_at | TIMESTAMP | Дата создания |
| users | updated_at | TIMESTAMP | Дата обновления |

### 2. Агенты (сотрудники поддержки)

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| agents | id | SERIAL | Уникальный идентификатор |
| agents | name | VARCHAR(255) | Имя агента |
| agents | message | TEXT | Сообщение/заметка |
| agents | is_active | BOOLEAN | Активность |
| agents | created_at | TIMESTAMP | Дата создания |
| agents | updated_at | TIMESTAMP | Дата обновления |

### 3. Клиенты и компании

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| customers | id | SERIAL | Уникальный идентификатор |
| customers | name | VARCHAR(255) | Название компании |
| customers | street | VARCHAR(255) | Улица |
| customers | zip | VARCHAR(20) | Почтовый индекс |
| customers | city | VARCHAR(255) | Город |
| customers | comment | TEXT | Комментарий |
| customers | is_active | BOOLEAN | Активность |
| customers | created_at | TIMESTAMP | Дата создания |
| customers | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| customer_users | id | SERIAL | Уникальный идентификатор |
| customer_users | name | VARCHAR(255) | Имя пользователя клиента |
| customer_users | message | TEXT | Сообщение |
| customer_users | is_active | BOOLEAN | Активность |
| customer_users | created_at | TIMESTAMP | Дата создания |
| customer_users | updated_at | TIMESTAMP | Дата обновления |

---

## Тикеты и обращения

### 4. Тикеты

| Таблица | Поле | Тип | Описание|-----|----------|
| tickets | id | SERIAL | Уникальный иденти |
|---------|------фикатор |
| tickets | ticket_number | VARCHAR(50) | Номер тикета (уникальный) |
| tickets | title | VARCHAR(255) | Заголовок тикета |
| tickets | description | TEXT | Описание тикета |
| tickets | type_id | INTEGER | Тип тикета (ссылка на types) |
| tickets | priority_id | INTEGER | Приоритет (ссылка на priorities) |
| tickets | queue_id | INTEGER | Очередь (ссылка на queues) |
| tickets | state_id | INTEGER | Статус (ссылка на states) |
| tickets | owner_id | INTEGER | Владелец (ссылка на agents) |
| tickets | company_id | INTEGER | Компания (ссылка на customers) |
| tickets | sla_id | INTEGER | SLA (ссылка на sla) |
| tickets | response_deadline | TIMESTAMP | Крайний срок первого ответа |
| tickets | resolution_deadline | TIMESTAMP | Крайний срок решения |
| tickets | first_response_at | TIMESTAMP | Время первого ответа |
| tickets | sla_violated | BOOLEAN | Нарушен ли SLA |
| tickets | pending_start_at | TIMESTAMP | Начало ожидания |
| tickets | is_active | BOOLEAN | Активность |
| tickets | created_at | TIMESTAMP WITH TIME ZONE | Дата создания |
| tickets | updated_at | TIMESTAMP WITH TIME ZONE | Дата обновления |

### 5. Справочники для тикетов

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| types | id | SERIAL | Уникальный идентификатор |
| types | name | VARCHAR(255) | Название типа |
| types | comment | TEXT | Комментарий |
| types | workflow_id | INTEGER | Ссылка на workflow |
| types | is_active | BOOLEAN | Активность |
| types | created_at | TIMESTAMP | Дата создания |
| types | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| priorities | id | SERIAL | Уникальный идентификатор |
| priorities | name | VARCHAR(255) | Название приоритета |
| priorities | color | VARCHAR(7) | Цвет в HEX формате |
| priorities | is_active | BOOLEAN | Активность |
| priorities | created_at | TIMESTAMP | Дата создания |
| priorities | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| states | id | SERIAL | Уникальный идентификатор |
| states | name | VARCHAR(255) | Название статуса |
| states | comment | TEXT | Комментарий |
| states | is_initial | BOOLEAN | Является ли статус начальным |
| states | is_active | BOOLEAN | Активность |
| states | created_at | TIMESTAMP | Дата создания |
| states | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| queues | id | SERIAL | Уникальный идентификатор |
| queues | name | VARCHAR(255) | Название очереди |
| queues | description | TEXT | Описание |
| queues | max_tickets | INTEGER | Максимум тикетов |
| queues | priority | INTEGER | Приоритет очереди |
| queues | company_id | INTEGER | Компания (ссылка на customers) |
| queues | service_id | INTEGER | Сервис (ссылка на services) |
| queues | sla_id | INTEGER | SLA (ссылка на sla) |
| queues | workflow_id | INTEGER | Workflow (ссылка на workflows) |
| queues | agent_group_id | INTEGER | Группа агентов (ссылка на agents_groups) |
| queues | priority_id | INTEGER | Приоритет по умолчанию (ссылка на priorities) |
| queues | email_config | JSONB | Конфигурация почты |
| queues | keywords | TEXT[] | Ключевые слова для авто-маршрутизации |
| queues | auto_response_template | TEXT | Шаблон авто-ответа |
| queues | template_id | INTEGER | Шаблон (ссылка на templates) |
| queues | is_active | BOOLEAN | Активность |
| queues | created_at | TIMESTAMP | Дата создания |
| queues | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| sla | id | SERIAL | Уникальный идентификатор |
| sla | name | VARCHAR(255) | Название SLA |
| sla | description | TEXT | Описание |
| sla | response_time | INTEGER | Время ответа (минуты) |
| sla | resolution_time | INTEGER | Время решения (минуты) |
| sla | is_active | BOOLEAN | Активность |
| sla | created_at | TIMESTAMP | Дата создания |
| sla | updated_at | TIMESTAMP | Дата обновления |

---

## Группы и роли

### 6. Группы агентов

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| agents_groups | id | SERIAL | Уникальный идентификатор |
| agents_groups | name | VARCHAR(255) | Название группы |
| agents_groups | message | TEXT | Сообщение |
| agents_groups | is_active | BOOLEAN | Активность |
| agents_groups | created_at | TIMESTAMP | Дата создания |
| agents_groups | updated_at | TIMESTAMP | Дата обновления |

### 7. Роли

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| roles | id | SERIAL | Уникальный идентификатор |
| roles | name | VARCHAR(255) | Название роли |
| roles | message | TEXT | Сообщение |
| roles | is_active | BOOLEAN | Активность |
| roles | created_at | TIMESTAMP | Дата создания |
| roles | updated_at | TIMESTAMP | Дата обновления |

### 8. Группы клиентов

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| customers_groups | id | SERIAL | Уникальный идентификатор |
| customers_groups | name | VARCHAR(255) | Название группы |
| customers_groups | message | TEXT | Сообщение |
| customers_groups | is_active | BOOLEAN | Активность |
| customers_groups | created_at | TIMESTAMP | Дата создания |
| customers_groups | updated_at | TIMESTAMP | Дата обновления |

### 9. Группы пользователей клиентов

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| customer_users_groups | id | SERIAL | Уникальный идентификатор |
| customer_users_groups | name | VARCHAR(255) | Название группы |
| customer_users_groups | message | TEXT | Сообщение |
| customer_users_groups | is_active | BOOLEAN | Активность |
| customer_users_groups | created_at | TIMESTAMP | Дата создания |
| customer_users_groups | updated_at | TIMESTAMP | Дата обновления |

---

## Рабочие процессы (Workflow)

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| workflows | id | SERIAL | Уникальный идентификатор |
| workflows | name | VARCHAR(255) | Название workflow |
| workflows | description | TEXT | Описание |
| workflows | is_active | BOOLEAN | Активность |
| workflows | created_at | TIMESTAMP WITH TIME ZONE | Дата создания |
| workflows | updated_at | TIMESTAMP WITH TIME ZONE | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| workflow_transitions | id | SERIAL | Уникальный идентификатор |
| workflow_transitions | workflow_id | INTEGER | Ссылка на workflow |
| workflow_transitions | source_status_id | INTEGER | Исходный статус |
| workflow_transitions | target_status_id | INTEGER | Целевой статус |
| workflow_transitions | action_label | VARCHAR(255) | Текст кнопки действия |
| workflow_transitions | sort_order | INTEGER | Порядок отображения |
| workflow_transitions | is_active | BOOLEAN | Активность |
| workflow_transitions | created_at | TIMESTAMP WITH TIME ZONE | Дата создания |
| workflow_transitions | updated_at | TIMESTAMP WITH TIME ZONE | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| ticket_status_history | id | SERIAL | Уникальный идентификатор |
| ticket_status_history | ticket_id | INTEGER | Ссылка на тикет |
| ticket_status_history | from_status_id | INTEGER | Предыдущий статус |
| ticket_status_history | to_status_id | INTEGER | Новый статус |
| ticket_status_history | transition_id | INTEGER | Ссылка на переход |
| ticket_status_history | changed_by | INTEGER | Кто изменил |
| ticket_status_history | comment | TEXT | Комментарий |
| ticket_status_history | created_at | TIMESTAMP WITH TIME ZONE | Дата изменения |

---

## Календарь и события

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| calendars | id | SERIAL | Уникальный идентификатор |
| calendars | name | VARCHAR(255) | Название календаря |
| calendars | description | TEXT | Описание |
| calendars | timezone | VARCHAR(255) | Временная зона |
| calendars | work_hours | VARCHAR(255) | Рабочие часы |
| calendars | is_active | BOOLEAN | Активность |
| calendars | created_at | TIMESTAMP | Дата создания |
| calendars | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| calendar_events | id | SERIAL | Уникальный идентификатор |
| calendar_events | calendar_id | INTEGER | Ссылка на календарь |
| calendar_events | title | VARCHAR(255) | Название события |
| calendar_events | start | TIMESTAMP | Начало события |
| calendar_events | event_end | TIMESTAMP | Конец события |
| calendar_events | all_day | BOOLEAN | Весь день |
| calendar_events | description | TEXT | Описание |
| calendar_events | created_at | TIMESTAMP | Дата создания |
| calendar_events | updated_at | TIMESTAMP | Дата обновления |

---

## Уведомления

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| admin_notification | id | SERIAL | Уникальный идентификатор |
| admin_notification | name | VARCHAR(255) | Название |
| admin_notification | message | TEXT | Сообщение |
| admin_notification | is_active | BOOLEAN | Активность |
| admin_notification | created_at | TIMESTAMP | Дата создания |
| admin_notification | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| ticket_notifications | id | SERIAL | Уникальный идентификатор |
| ticket_notifications | name | VARCHAR(255) | Название |
| ticket_notifications | message | TEXT | Сообщение |
| ticket_notifications | is_active | BOOLEAN | Активность |
| ticket_notifications | created_at | TIMESTAMP | Дата создания |
| ticket_notifications | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| appointment_notifications | id | SERIAL | Уникальный идентификатор |
| appointment_notifications | name | VARCHAR(255) | Название |
| appointment_notifications | message | TEXT | Сообщение |
| appointment_notifications | is_active | BOOLEAN | Активность |
| appointment_notifications | created_at | TIMESTAMP | Дата создания |
| appointment_notifications | updated_at | TIMESTAMP | Дата обновления |

---

## Email и почта

### 11. Email адреса

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| email_addresses | id | SERIAL | Уникальный идентификатор |
| email_addresses | name | VARCHAR(255) | Название |
| email_addresses | message | TEXT | Сообщение |
| email_addresses | is_active | BOOLEAN | Активность |
| email_addresses | created_at | TIMESTAMP | Дата создания |
| email_addresses | updated_at | TIMESTAMP | Дата обновления |

### 12. Почтовые аккаунты PostMaster

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| post_master_mail_accounts | id | SERIAL | Уникальный идентификатор |
| post_master_mail_accounts | name | VARCHAR(255) | Название |
| post_master_mail_accounts | message | TEXT | Сообщение |
| post_master_mail_accounts | is_active | BOOLEAN | Активность |
| post_master_mail_accounts | created_at | TIMESTAMP | Дата создания |
| post_master_mail_accounts | updated_at | TIMESTAMP | Дата обновления |

### 13. Фильтры почты

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| post_master_filters | id | SERIAL | Уникальный идентификатор |
| post_master_filters | name | VARCHAR(255) | Название |
| post_master_filters | message | TEXT | Сообщение |
| post_master_filters | is_active | BOOLEAN | Активность |
| post_master_filters | created_at | TIMESTAMP | Дата создания |
| post_master_filters | updated_at | TIMESTAMP | Дата обновления |

---

## Шаблоны и подписи

### 14. Шаблоны

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| templates | id | SERIAL | Уникальный идентификатор |
| templates | name | VARCHAR(255) | Название |
| templates | message | TEXT | Сообщение |
| templates | is_active | BOOLEAN | Активность |
| templates | created_at | TIMESTAMP | Дата создания |
| templates | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| template_queues | id | SERIAL | Уникальный идентификатор |
| template_queues | name | VARCHAR(255) | Название |
| template_queues | message | TEXT | Сообщение |
| template_queues | is_active | BOOLEAN | Активность |
| template_queues | created_at | TIMESTAMP | Дата создания |
| template_queues | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| template_attachments | id | SERIAL | Уникальный идентификатор |
| template_attachments | name | VARCHAR(255) | Название |
| template_attachments | message | TEXT | Сообщение |
| template_attachments | is_active | BOOLEAN | Активность |
| template_attachments | created_at | TIMESTAMP | Дата создания |
| template_attachments | updated_at | TIMESTAMP | Дата обновления |

### 15. Приветствия

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| greetings | id | SERIAL | Уникальный идентификатор |
| greetings | name | VARCHAR(255) | Название |
| greetings | comment | TEXT | Комментарий |
| greetings | is_active | BOOLEAN | Активность |
| greetings | created_at | TIMESTAMP | Дата создания |
| greetings | updated_at | TIMESTAMP | Дата обновления |

### 16. Подписи

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| signatures | id | SERIAL | Уникальный идентификатор |
| signatures | name | VARCHAR(255) | Название |
| signatures | content | TEXT | Содержание подписи |
| signatures | is_active | BOOLEAN | Активность |
| signatures | created_at | TIMESTAMP | Дата создания |
| signatures | updated_at | TIMESTAMP | Дата обновления |

---

## Услуги и сервисы

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| services | id | SERIAL | Уникальный идентификатор |
| services | name | VARCHAR(255) | Название услуги |
| services | comment | TEXT | Комментарий |
| services | is_active | BOOLEAN | Активность |
| services | created_at | TIMESTAMP | Дата создания |
| services | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| customer_users_services | id | SERIAL | Уникальный идентификатор |
| customer_users_services | name | VARCHAR(255) | Название |
| customer_users_services | message | TEXT | Сообщение |
| customer_users_services | is_active | BOOLEAN | Активность |
| customer_users_services | created_at | TIMESTAMP | Дата создания |
| customer_users_services | updated_at | TIMESTAMP | Дата обновления |

---

## Автоматизация

### 17. Автоответы

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| auto_responses | id | SERIAL | Уникальный идентификатор |
| auto_responses | name | VARCHAR(255) | Название |
| auto_responses | trigger | VARCHAR(255) | Триггер |
| auto_responses | response | TEXT | Ответ |
| auto_responses | delay | INTEGER | Задержка (секунды) |
| auto_responses | is_active | BOOLEAN | Активность |
| auto_responses | created_at | TIMESTAMP | Дата создания |
| auto_responses | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| queue_auto_response | id | SERIAL | Уникальный идентификатор |
| queue_auto_response | name | VARCHAR(255) | Название |
| queue_auto_response | message | TEXT | Сообщение |
| queue_auto_response | is_active | BOOLEAN | Активность |
| queue_auto_response | created_at | TIMESTAMP | Дата создания |
| queue_auto_response | updated_at | TIMESTAMP | Дата обновления |

### 18. Generic Agent

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| generic_agent | id | SERIAL | Уникальный идентификатор |
| generic_agent | name | VARCHAR(255) | Название |
| generic_agent | description | TEXT | Описание |
| generic_agent | trigger_type | VARCHAR(255) | Тип триггера |
| generic_agent | schedule | VARCHAR(255) | Расписание |
| generic_agent | last_run | VARCHAR(255) | Последний запуск |
| generic_agent | next_run | VARCHAR(255) | Следующий запуск |
| generic_agent | is_active | BOOLEAN | Активность |
| generic_agent | created_at | TIMESTAMP | Дата создания |
| generic_agent | updated_at | TIMESTAMP | Дата обновления |

### 19. Управление процессами

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| process_management | id | SERIAL | Уникальный идентификатор |
| process_management | name | VARCHAR(255) | Название |
| process_management | description | TEXT | Описание |
| process_management | process_type | VARCHAR(255) | Тип процесса |
| process_management | last_executed | VARCHAR(255) | Последнее выполнение |
| process_management | next_execution | VARCHAR(255) | Следующее выполнение |
| process_management | is_active | BOOLEAN | Активность |
| process_management | created_at | TIMESTAMP | Дата создания |
| process_management | updated_at | TIMESTAMP | Дата обновления |

---

---

## Вложения

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| attachments | id | SERIAL | Уникальный идентификатор |
| attachments | name | VARCHAR(255) | Название |
| attachments | file_name | VARCHAR(255) | Имя файла |
| attachments | type | INTEGER | Тип |
| attachments | comment | TEXT | Комментарий |
| attachments | is_active | BOOLEAN | Активность |
| attachments | created_at | TIMESTAMP | Дата создания |
| attachments | updated_at | TIMESTAMP | Дата обновления |

---

---

## Системные настройки

### 23. Конфигурация

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| system_configuration | id | SERIAL | Уникальный идентификатор |
| system_configuration | name | VARCHAR(255) | Название |
| system_configuration | description | TEXT | Описание |
| system_configuration | value | VARCHAR(255) | Значение |
| system_configuration | config_type | VARCHAR(255) | Тип конфигурации |
| system_configuration | is_editable | BOOLEAN | Редактируемое |
| system_configuration | is_active | BOOLEAN | Активность |
| system_configuration | created_at | TIMESTAMP | Дата создания |
| system_configuration | updated_at | TIMESTAMP | Дата обновления |

### 24. Логи

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| system_log | id | SERIAL | Уникальный идентификатор |
| system_log | name | VARCHAR(255) | Название |
| system_log | message | TEXT | Сообщение |
| system_log | is_active | BOOLEAN | Активность |
| system_log | created_at | TIMESTAMP | Дата создания |
| system_log | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| communication_log | id | SERIAL | Уникальный идентификатор |
| communication_log | name | VARCHAR(255) | Название |
| communication_log | message | TEXT | Сообщение |
| communication_log | is_active | BOOLEAN | Активность |
| communication_log | created_at | TIMESTAMP | Дата создания |
| communication_log | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| performance_log | id | SERIAL | Уникальный идентификатор |
| performance_log | name | VARCHAR(255) | Название |
| performance_log | message | TEXT | Сообщение |
| performance_log | is_active | BOOLEAN | Активность |
| performance_log | created_at | TIMESTAMP | Дата создания |
| performance_log | updated_at | TIMESTAMP | Дата обновления |

### 25. Сессии

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| session_management | id | SERIAL | Уникальный идентификатор |
| session_management | username | VARCHAR(255) | Имя пользователя |
| session_management | ip_address | VARCHAR(255) | IP адрес |
| session_management | user_agent | VARCHAR(255) | User Agent |
| session_management | login_time | VARCHAR(255) | Время входа |
| session_management | last_activity | VARCHAR(255) | Последняя активность |
| session_management | is_active | BOOLEAN | Активность |
| session_management | created_at | TIMESTAMP | Дата создания |
| session_management | updated_at | TIMESTAMP | Дата обновления |

---

## Дополнительные модули

### 27. Веб-сервисы

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| web_services | id | SERIAL | Уникальный идентификатор |
| web_services | name | VARCHAR(255) | Название |
| web_services | description | TEXT | Описание |
| web_services | endpoint | VARCHAR(255) | Endpoint URL |
| web_services | method | VARCHAR(255) | HTTP метод |
| web_services | last_tested | VARCHAR(255) | Последняя проверка |
| web_services | is_active | BOOLEAN | Активность |
| web_services | created_at | TIMESTAMP | Дата создания |
| web_services | updated_at | TIMESTAMP | Дата обновления |

### 30. Сбор данных поддержки

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| support_data_collector | id | SERIAL | Уникальный идентификатор |
| support_data_collector | name | VARCHAR(255) | Название |
| support_data_collector | message | TEXT | Сообщение |
| support_data_collector | is_active | BOOLEAN | Активность |
| support_data_collector | created_at | TIMESTAMP | Дата создания |
| support_data_collector | updated_at | TIMESTAMP | Дата обновления |

### 31. Файл поддержки системы

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| system_file_support | id | SERIAL | Уникальный идентификатор |
| system_file_support | name | VARCHAR(255) | Название |
| system_file_support | message | TEXT | Сообщение |
| system_file_support | is_active | BOOLEAN | Активность |
| system_file_support | created_at | TIMESTAMP | Дата создания |
| system_file_support | updated_at | TIMESTAMP | Дата обновления |

---

## Справочники и переводы

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| general_catalog | id | SERIAL | Уникальный идентификатор |
| general_catalog | name | VARCHAR(255) | Название |
| general_catalog | message | TEXT | Сообщение |
| general_catalog | is_active | BOOLEAN | Активность |
| general_catalog | created_at | TIMESTAMP | Дата создания |
| general_catalog | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| translation | id | SERIAL | Уникальный идентификатор |
| translation | name | VARCHAR(255) | Название |
| translation | message | TEXT | Сообщение |
| translation | is_active | BOOLEAN | Активность |
| translation | created_at | TIMESTAMP | Дата создания |
| translation | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| groups | id | SERIAL | Уникальный идентификатор |
| groups | name | VARCHAR(255) | Название |
| groups | message | TEXT | Сообщение |
| groups | is_active | BOOLEAN | Активность |
| groups | created_at | TIMESTAMP | Дата создания |
| groups | updated_at | TIMESTAMP | Дата обновления |

---

## Настройки уведомлений

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| communication_notifications_settings | id | SERIAL | Уникальный идентификатор |
| communication_notifications_settings | name | VARCHAR(255) | Название |
| communication_notifications_settings | description | TEXT | Описание |
| communication_notifications_settings | is_active | BOOLEAN | Активность |
| communication_notifications_settings | created_at | TIMESTAMP | Дата создания |
| communication_notifications_settings | updated_at | TIMESTAMP | Дата обновления |

---

## Тестовые сущности

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| test_entities | id | SERIAL | Уникальный идентификатор |
| test_entities | name | VARCHAR(255) | Название |
| test_entities | comment | TEXT | Комментарий |
| test_entities | is_active | BOOLEAN | Активность |
| test_entities | created_at | TIMESTAMP | Дата создания |
| test_entities | updated_at | TIMESTAMP | Дата обновления |

---

## Связывающие таблицы (M2M)

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| agents_groups_agents | id | SERIAL | Уникальный идентификатор |
| agents_groups_agents | agents_group_id | INTEGER | Ссылка на группу агентов |
| agents_groups_agents | agent_id | INTEGER | Ссылка на агента |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| agents_roles | id | SERIAL | Уникальный идентификатор |
| agents_roles | name | VARCHAR(255) | Название |
| agents_roles | message | TEXT | Сообщение |
| agents_roles | is_active | BOOLEAN | Активность |
| agents_roles | created_at | TIMESTAMP | Дата создания |
| agents_roles | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| roles_groups | id | SERIAL | Уникальный идентификатор |
| roles_groups | name | VARCHAR(255) | Название |
| roles_groups | message | TEXT | Сообщение |
| roles_groups | is_active | BOOLEAN | Активность |
| roles_groups | created_at | TIMESTAMP | Дата создания |
| roles_groups | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| users_groups_roles_settings | id | SERIAL | Уникальный идентификатор |
| users_groups_roles_settings | name | VARCHAR(255) | Название |
| users_groups_roles_settings | description | TEXT | Описание |
| users_groups_roles_settings | is_active | BOOLEAN | Активность |
| users_groups_roles_settings | created_at | TIMESTAMP | Дата создания |
| users_groups_roles_settings | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| customer_users_customers | id | SERIAL | Уникальный идентификатор |
| customer_users_customers | name | VARCHAR(255) | Название |
| customer_users_customers | message | TEXT | Сообщение |
| customer_users_customers | is_active | BOOLEAN | Активность |
| customer_users_customers | created_at | TIMESTAMP | Дата создания |
| customer_users_customers | updated_at | TIMESTAMP | Дата обновления |

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| processes_automation_settings | id | SERIAL | Уникальный идентификатор |
| processes_automation_settings | name | VARCHAR(255) | Название |
| processes_automation_settings | description | TEXT | Описание |
| processes_automation_settings | is_active | BOOLEAN | Активность |
| processes_automation_settings | created_at | TIMESTAMP | Дата создания |
| processes_automation_settings | updated_at | TIMESTAMP | Дата обновления |

---

## База Знаний

### knowledge_base

| Таблица | Поле | Тип | Описание |
|---------|------|-----|----------|
| knowledge_base | id | SERIAL | Уникальный идентификатор |
| knowledge_base | title | VARCHAR(255) | Заголовок статьи |
| knowledge_base | content | TEXT | Содержание статьи (Markdown/HTML) |
| knowledge_base | category_id | INTEGER | Категория (ссылка на types) |
| knowledge_base | tags | TEXT[] | Теги для поиска |
| knowledge_base | service_id | INTEGER | Связанный сервис (ссылка на services) |
| knowledge_base | is_published | BOOLEAN | Опубликована ли статья |
| knowledge_base | views_count | INTEGER | Количество просмотров |
| knowledge_base | created_by | INTEGER | Автор статьи (ссылка на agents) |
| knowledge_base | created_at | TIMESTAMP | Дата создания |
| knowledge_base | updated_at | TIMESTAMP | Дата обновления |
| knowledge_base | is_active | BOOLEAN | Активность |

---

## Типы данных PostgreSQL

| Тип | Описание |
|-----|----------|
| SERIAL | Автоинкрементное целое число |
| VARCHAR(n) | Строка переменной длины, максимум n символов |
| TEXT | Текст неограниченной длины |
| BOOLEAN | Логическое значение (true/false) |
| TIMESTAMP | Дата и время без часового пояса |
| TIMESTAMP WITH TIME ZONE | Дата и время с часовым поясом |
| INTEGER | Целое число |
| TEXT[] | Массив текстовых значений |

---

## Общие поля

Большинство таблиц содержат следующие общие поля:

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный идентификатор |
| name | VARCHAR(255) | Название/имя |
| is_active | BOOLEAN | Активность записи |
| created_at | TIMESTAMP | Дата создания записи |
| updated_at | TIMESTAMP | Дата последнего обновления |

---

## Индексы

Для всех таблиц создаются индексы:
- Индекс на поле `name` (idx_{table}_name)
- Индекс на поле `is_active` (idx_{table}_is_active)

Также создаются триггеры для автоматического обновления поля `updated_at` при изменении записей.
