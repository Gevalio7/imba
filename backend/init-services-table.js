const { pool } = require('./config/db')
const Services = require('./models/services')

async function initServicesTable() {
  try {
    console.log('🔄 Проверка и наполнение таблицы services тестовыми данными...')

    // Получаем существующие сервисы
    const existingData = await pool.query('SELECT name FROM services')
    const existingNames = existingData.rows.map(row => row.name)

    // Тестовые данные для сервисов
    const testServices = [
      { name: 'Техническая поддержка', comment: 'Общая техническая поддержка пользователей', isActive: true },
      { name: 'Консультации', comment: 'Консультационные услуги', isActive: true },
      { name: 'Разработка ПО', comment: 'Услуги по разработке программного обеспечения', isActive: true },
      { name: 'Системное администрирование', comment: 'Администрирование серверов и систем', isActive: true },
      { name: 'Обучение', comment: 'Обучение пользователей и специалистов', isActive: true },
      { name: 'Аудит безопасности', comment: 'Проверка и анализ безопасности систем', isActive: true },
      { name: 'Оптимизация производительности', comment: 'Улучшение производительности систем', isActive: true },
      { name: 'Резервное копирование', comment: 'Услуги по резервному копированию данных', isActive: true },
      { name: 'Мониторинг', comment: 'Мониторинг систем и приложений', isActive: true },
      { name: 'Интеграция систем', comment: 'Интеграция различных систем и приложений', isActive: true },
    ]

    let addedCount = 0

    console.log('📝 Вставка тестовых данных...')

    for (const service of testServices) {
      if (!existingNames.includes(service.name)) {
        await Services.create(service)
        console.log(`   ✅ Добавлен сервис: ${service.name}`)
        addedCount++
      }
      else {
        console.log(`   ℹ️  Сервис "${service.name}" уже существует, пропускаем`)
      }
    }

    console.log('✅ Наполнение таблицы services завершено успешно')
    console.log(`   Добавлено ${addedCount} новых тестовых записей`)

    process.exit(0)
  }
  catch (error) {
    console.error('❌ Ошибка наполнения таблицы services:', error)
    process.exit(1)
  }
}

initServicesTable()
