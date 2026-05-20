const { pool } = require('./config/db')

async function addTestData() {
  try {
    console.log('🔄 Добавление тестовых данных...')

    // Queues
    await pool.query(`INSERT INTO queues (name, description, max_tickets, priority, is_active) VALUES
      ('Техническая поддержка', 'Очередь для технических вопросов', 100, 2, true),
      ('Продажи', 'Очередь для вопросов по продажам', 50, 1, true),
      ('Бухгалтерия', 'Очередь для финансовых вопросов', 20, 3, true)
      ON CONFLICT DO NOTHING`)
    console.log('✅ Добавлены тестовые очереди')

    // Templates
    await pool.query(`INSERT INTO templates (name, message, is_active) VALUES
      ('Шаблон ответа на инцидент', 'Уважаемый клиент, мы получили ваше обращение и уже работаем над решением проблемы.', true),
      ('Шаблон подтверждения', 'Ваше обращение зарегистрировано под номером #ID.', true),
      ('Шаблон закрытия', 'Ваше обращение успешно решено. Спасибо за обращение!', true)
      ON CONFLICT DO NOTHING`)
    console.log('✅ Добавлены тестовые шаблоны')

    // SLA
    await pool.query(`INSERT INTO sla (name, description, response_time, resolution_time, is_active) VALUES
      ('Стандартный SLA', 'Стандартное соглашение об уровне сервиса', 4, 24, true),
      ('Премиум SLA', 'Премиум соглашение с быстрым реагированием', 1, 8, true),
      ('Базовый SLA', 'Базовое соглашение для простых запросов', 8, 48, true)
      ON CONFLICT DO NOTHING`)
    console.log('✅ Добавлены тестовые SLA')

    console.log('✅ Все тестовые данные добавлены успешно')
    process.exit(0)
  }
  catch (err) {
    console.error('❌ Ошибка:', err)
    process.exit(1)
  }
}

addTestData()
