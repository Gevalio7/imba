# 📋 ПЛАН: Интеграция z.ai LLM в Helpdesk систему

## 📊 Анализ текущего состояния

### Существующая инфраструктура
- **Backend**: Node.js/Express + PostgreSQL
- **Frontend**: Vue.js  
- **База данных**: 60+ таблиц (tickets, agents, queues, types, priorities, states, SLA, etc.)
- **LLM**: z.ai (ключ предоставлен)

### Приоритет сейчас
1. Создание тикетов вручную (почти готово)
2. Сбор заявок с почты через справочник очередей
3. Расчет SLA и нарушения
4. Маршрутизация по группам агентов

---

## 🎯 ЧТО НУЖНО СДЕЛАТЬ

### Этап 1: Настройка z.ai LLM

- [ ] **1.1** Подключить z.ai API
  - Конфиг: LLM_PROVIDER=zai
  - API Key: предоставлен
  - Base URL: https://api.z.ai/v1

- [ ] **1.2** Создать абстракцию LLM-провайдера
  - Поддержка: zai (основной), с возможностью переключения на локальный

---

### Этап 2: Email парсинг и сбор заявок

- [ ] **2.1** Настроить IMAP подключение для почты
  - Чтение из нескольких почтовых ящиков
  - Справочник почтовых ящиков (уже есть: postMasterMailAccounts)

- [ ] **2.2** Создать API для webhook обработки писем
  - POST /webhooks/email — парсинг входящих писем
  - Извлечение: from, subject, body, attachments, in_reply_to

- [ ] **2.3** Настроить логику маршрутизации
  - По компании (domain)
  - По сервису (subject/body keywords)
  - Назначение группы агентов

---

### Этап 3: Справочник очередей (queues)

- [ ] **3.1** Расширить таблицу queues
  - company_id — компания
  - service_id — сервис
  - email_config — настройки почты (host, port, username)
  - sla_policy_id — SLA правило
  - workflow_id — рабочий процесс
  - priority_id — приоритет по умолчанию
  - agent_group_id — группа агентов

- [ ] **3.2** API для очередей
  - GET /api/queues/email-config — получить настройки для IMAP
  - POST /api/queues — создать очередь с настройками

- [ ] **3.3** Frontend для настройки очередей
  - Форма настройки почты для каждой очереди
  - Привязка сервисов, SLA, групп

---

### Этап 4: SLA расчет и мониторинг

- [ ] **4.1** Расширить таблицу SLA
  - response_time — время первого ответа (минуты)
  - resolution_time — время решения (минуты)
  - escalation_rules — правила эскалации
  - notification_percentage — процент уведомления

- [ ] **4.2** Создать сервис расчета SLA
  - Вычисление дедлайнов при создании тикета
  - Проверка нарушений при каждом действии
  - Уведомление при нарушении

- [ ] **4.3** Мониторинг SLA
  - Dashboard с текущими нарушениями
  - История SLA compliance

---

### Этап 5: Создание Базы Знаний

- [ ] **5.1** Создать таблицу knowledge_base
  - id, title, content, category_id, tags[], is_active, created_at

- [ ] **5.2** API для Базы Знаний
  - GET /api/kb — список статей
  - POST /api/kb — создать статью
  - GET /api/kb/search?q= — поиск

- [ ] **5.3** Frontend для Базы Знаний
  - CRUD статьей
  - Теги и категории

---

### Этап 6: Интеграция z.ai (AI оркестратор)

- [ ] **6.1** Подготовить API для AI
  - GET /api/directories/categories — категории
  - GET /api/directories/users — пользователи
  - GET /api/kb/search — поиск по БЗ

- [ ] **6.2** Настроить z.ai для помощи
  - Анализ входящих писем
  - Предложение категории/приоритета
  - Поиск решений в БЗ
  - Предложение исполнителя

- [ ] **6.3** System prompt для AI агента
  - Инструкции по классификации
  - Правила маршрутизации
  - Формат ответа

---

### Этап 7: Интеграция с Confluence и Jira (будущий этап)

- [ ] **7.1** Интеграция с Confluence DC
  - Поиск статей в Confluence
  - Создание черновиков статей из тикетов

- [ ] **7.2** Интеграция с Jira DC
  - Создание задач на разработку
  - Синхронизация статусов

---

## 🔄 Текущий фокус ( ближайшие задачи)

```
Этап 1 → Этап 2 → Этап 3 → Этап 4 → Этап 5 → Этап 6
                     ↓
              (Этап 7 - потом)
```

### Приоритет 1: Email сбор + создание тикетов
- Настроить IMAP
- Справочник очередей с настройками почты
- Создание тикета из письма

### Приоритет 2: SLA
- Расчет дедлайнов
- Мониторинг нарушений
- Уведомления

### Приоритет 3: AI помощник
- Подключить z.ai
- Анализ писем
- Поиск в БЗ

---

## 📦 Структура после интеграции

```
backend/
├── controllers/
│   ├── emailParserController.js    # NEW: Парсинг писем
│   ├── queuesController.js        # UPDATE: Добавить email_config
│   ├── slaController.js           # UPDATE: Расширить
│   ├── knowledgeBaseController.js # NEW: База знаний
│   └── aiController.js           # NEW: AI оркестратор
├── services/
│   ├── imapService.js            # NEW: Сбор почты
│   ├── slaCalculator.js          # NEW: Расчет SLA
│   ├── llmProvider.js            # NEW: z.ai провайдер
├── models/
│   ├── knowledgeBase.js          # NEW
│   └── queues.js                 # UPDATE
.env
LLM_PROVIDER=zai
LLM_API_KEY=제공된 ключ
LLM_BASE_URL=https://api.z.ai/v1
```

---

## ⚙️ Конфигурация (.env)

```bash
# LLM (z.ai)
LLM_PROVIDER=zai
LLM_BASE_URL=https://api.z.ai/v1
LLM_API_KEY=ваш_ключ

# Email
IMAP_HOST=imap.example.com
IMAP_PORT=993

# OpenClaw (если понадобится)
HELPDESK_API_URL=http://localhost:3000/api
```

---

*План обновлен с учетом ответов*
*Z.AI ключ: 241c6fc38fb64579813a2ce935204095.eUAfsixr76Cx2juZ*
