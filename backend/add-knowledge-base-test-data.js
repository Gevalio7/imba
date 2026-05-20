/**
 * Скрипт для генерации тестовых данных Базы Знаний
 * Запустить: node add-knowledge-base-test-data.js
 */

require('dotenv').config()

const { pool } = require('./config/db')

const testArticles = [
  {
    title: 'Как создать новую заявку в системе',
    content: `<h2>Создание новой заявки</h2>
<p>Для создания новой заявки выполните следующие шаги:</p>
<ol>
<li>Перейдите в раздел "Заявки"</li>
<li>Нажмите кнопку "Создать заявку"</li>
<li>Заполните обязательные поля:
    <ul>
    <li>Тема заявки</li>
    <li>Описание проблемы</li>
    <li>Приоритет</li>
    </ul>
</li>
<li>Нажмите "Создать"</li>
</ol>
<p>После создания заявки ей будет присвоен уникальный номер и статус "Новая".</p>`,
    categoryName: 'Инструкции',
    tags: ['заявка', 'создание', 'тикет', 'инструкция'],
    serviceName: 'Поддержка',
    isPublished: true,
    viewsCount: 156,
  },
  {
    title: 'Работа с电子邮件 - настройка почтового ящика',
    content: `<h2>Настройка почтового ящика</h2>
<p>В этом руководстве описано как настроить почтовый ящик для работы с системой:</p>
<h3>Шаг 1: Создание почтового ящика</h3>
<p>Перейдите в раздел "Почтовые ящики" и нажмите "Добавить новый".</p>
<h3>Шаг 2: Настройка параметров</h3>
<p>Укажите:</p>
<ul>
<li>Email адрес</li>
<li>Имя пользователя</li>
<li>Пароль</li>
<li>IMAP/SMTP серверы</li>
</ul>
<h3>Шаг 3: Проверка подключения</h3>
<p>Нажмите "Проверить подключение" для верификации настроек.</p>`,
    categoryName: 'Инструкции',
    tags: ['email', 'почта', 'настройка', 'mail'],
    serviceName: 'Email',
    isPublished: true,
    viewsCount: 89,
  },
  {
    title: 'Настройка SLA для заявок',
    content: `<h2>Что такое SLA?</h2>
<p>SLA (Service Level Agreement) - соглашение об уровне сервиса, определяющее время реакции на заявки.</p>
<h3>Основные параметры SLA:</h3>
<ul>
<li><strong>Время первого ответа</strong> - максимальное время до первого ответа</li>
<li><strong>Время решения</strong> - максимальное время полного решения</li>
<li><strong>Приоритет</strong> - влияет на сроки</li>
</ul>
<h3>Настройка в системе:</h3>
<p>Перейдите в раздел "SLA" и создайте новое правило с нужными параметрами.</p>`,
    categoryName: 'Инструкции',
    tags: ['sla', 'настройка', 'время', 'приоритет'],
    serviceName: 'SLA',
    isPublished: true,
    viewsCount: 234,
  },
  {
    title: 'Управление правами доступа агентов',
    content: `<h2>Права доступа</h2>
<p>Система поддерживает гибкую систему прав доступа для агентов.</p>
<h3>Роли:</h3>
<ul>
<li><strong>Администратор</strong> - полный доступ</li>
<li><strong>Супервизор</strong> - управление агентами</li>
<li><strong>Агент</strong> - работа с заявками</li>
</ul>
<h3>Назначение ролей:</h3>
<p>Перейдите в профиль агента и выберите нужную роль из списка.</p>`,
    categoryName: 'Администрирование',
    tags: ['права', 'доступ', 'роли', 'безопасность'],
    serviceName: 'Агенты',
    isPublished: true,
    viewsCount: 67,
  },
  {
    title: 'Интеграция с внешними системами через API',
    content: `<h2>REST API</h2>
<p>Система предоставляет REST API для интеграции с внешними системами.</p>
<h3>Базовый URL:</h3>
<pre><code>https://api.example.com/v1</code></pre>
<h3>Аутентификация:</h3>
<p>Используйте Bearer токен в заголовке:</p>
<pre><code>Authorization: Bearer YOUR_TOKEN</code></pre>
<h3>Основные эндпоинты:</h3>
<ul>
<li>GET /tickets - список заявок</li>
<li>POST /tickets - создание заявки</li>
<li>GET /customers - список клиентов</li>
</ul>`,
    categoryName: 'Разработка',
    tags: ['api', 'интеграция', 'rest', 'разработка'],
    serviceName: 'API',
    isPublished: true,
    viewsCount: 312,
  },
  {
    title: 'Создание шаблонов ответов',
    content: `<h2>Шаблоны ответов</h2>
<p>Шаблоны позволяют быстро отвечать на типичные обращения.</p>
<h3>Создание шаблона:</h3>
<ol>
<li>Перейдите в "Шаблоны"</li>
<li>Нажмите "Создать шаблон"</li>
<li>Заполните название и содержание</li>
<li>Используйте переменные: {{ticket.id}}, {{customer.name}}</li>
</ol>
<h3>Использование:</h3>
<p>При ответе на заявку нажмите кнопку "Вставить шаблон" и выберите нужный.</p>`,
    categoryName: 'Инструкции',
    tags: ['шаблон', 'ответ', 'быстрый ответ'],
    serviceName: 'Шаблоны',
    isPublished: true,
    viewsCount: 145,
  },
  {
    title: 'Настройка уведомлений',
    content: `<h2>Система уведомлений</h2>
<p>Настройте уведомления для различных событий в системе.</p>
<h3>Типы уведомлений:</h3>
<ul>
<li>Email - отправка на почту</li>
<li>SMS - текстовые сообщения</li>
<li>Telegram - бот уведомлений</li>
</ul>
<h3>Настройка:</h3>
<p>Перейдите в "Настройки" -> "Уведомления" и настройте каналы.</p>`,
    categoryName: 'Администрирование',
    tags: ['уведомления', 'email', 'sms', 'telegram'],
    serviceName: 'Уведомления',
    isPublished: false,
    viewsCount: 23,
  },
  {
    title: 'Работа с календарями и графиком',
    content: `<h2>Календари</h2>
<p>Настройте рабочее время и графики для корректного расчёта SLA.</p>
<h3>Создание календаря:</h3>
<ol>
<li>Перейдите в "Календари"</li>
<li>Создайте новый календарь</li>
<li>Настройте рабочие часы</li>
<li>Добавьте праздничные дни</li>
</ol>
<h3>Привязка к SLA:</h3>
<p>Выберите календарь при настройке правила SLA.</p>`,
    categoryName: 'Инструкции',
    tags: ['календарь', 'график', 'рабочее время', 'sla'],
    serviceName: 'Календари',
    isPublished: true,
    viewsCount: 78,
  },
  {
    title: 'Часто задаваемые вопросы (FAQ)',
    content: `<h2>FAQ - Часто задаваемые вопросы</h2>
<h3>Как сбросить пароль?</h3>
<p>Нажмите "Забыли пароль" на странице входа.</p>
<h3>Как изменить язык интерфейса?</h3>
<p>Перейдите в профиль -> Настройки -> Язык.</p>
<h3>Почему я не вижу заявки?</h3>
<p>Проверьте ваши права доступа и группу агентов.</p>
<h3>Как экспортировать данные?</h3>
<p>Используйте кнопку "Экспорт" в нужном разделе.</p>`,
    categoryName: 'FAQ',
    tags: ['faq', 'вопросы', 'помощь', 'поддержка'],
    serviceName: 'Поддержка',
    isPublished: true,
    viewsCount: 567,
  },
  {
    title: 'Миграция данных из другой системы',
    content: `<h2>Миграция данных</h2>
<p>Руководство по переносу данных из другой системы поддержки.</p>
<h3>Подготовка:</h3>
<ul>
<li>Экспортируйте данные в CSV/JSON</li>
<li>Проверьте формат полей</li>
<li>Создайте резервную копию</p>
<h3>Импорт:</h3>
<p>Используйте инструмент миграции в разделе "Настройки" -> "Миграция".</p>
<h3>После миграции:</h3>
<ul>
<li>Проверьте целостность данных</li>
<li>Обновите нумерацию заявок</li>
<li>Настройте права доступа</li>
</ul>`,
    categoryName: 'Администрирование',
    tags: ['миграция', 'импорт', 'данные', 'перенос'],
    serviceName: 'Миграция',
    isPublished: true,
    viewsCount: 45,
  },
]

async function getOrCreateCategory(categoryName) {
  // Проверяем есть ли категория
  const existing = await pool.query(
    "SELECT id FROM types WHERE name = $1",
    [categoryName],
  )

  if (existing.rows.length > 0)
    return existing.rows[0].id

  // Создаем новую категорию
  const result = await pool.query(
    "INSERT INTO types (name, is_active) VALUES ($1, true) RETURNING id",
    [categoryName],
  )

  return result.rows[0].id
}

async function getOrCreateService(serviceName) {
  // Проверяем есть ли сервис
  const existing = await pool.query(
    "SELECT id FROM services WHERE name = $1",
    [serviceName],
  )

  if (existing.rows.length > 0)
    return existing.rows[0].id

  // Создаем новый сервис
  const result = await pool.query(
    "INSERT INTO services (name, is_active) VALUES ($1, true) RETURNING id",
    [serviceName],
  )

  return result.rows[0].id
}

async function addTestData() {
  const client = await pool.connect()

  try {
    console.log('🚀 Начинаем добавление тестовых данных...')

    // Создаем тестового агента (или получаем существующего)
    const agentResult = await client.query("SELECT id FROM agents LIMIT 1")
    const createdBy = agentResult.rows[0]?.id || 1

    for (const article of testArticles) {
      // Получаем или создаем категорию
      const categoryId = await getOrCreateCategory(article.categoryName)

      // Получаем или создаем сервис
      const serviceId = await getOrCreateService(article.serviceName)

      // Вставляем статью
      await client.query(
        `INSERT INTO knowledge_base 
         (title, content, category_id, tags, service_id, is_published, views_count, created_by, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())`,
        [
          article.title,
          article.content,
          categoryId,
          article.tags,
          serviceId,
          article.isPublished,
          article.viewsCount,
          createdBy,
        ],
      )

      console.log(`✅ Добавлена статья: ${article.title}`)
    }

    console.log('\n🎉 Все тестовые данные успешно добавлены!')
    console.log(`📊 Всего статей: ${testArticles.length}`)
  }
  catch (error) {
    console.error('❌ Ошибка при добавлении данных:', error)
  }
  finally {
    client.release()
    await pool.end()
  }
}

// Запуск
addTestData()
