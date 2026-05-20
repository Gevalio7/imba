const { pool } = require('./config/db')
const Types = require('./models/types')

async function initTypesTable() {
  try {
    console.log('🔄 Проверка и наполнение таблицы types тестовыми данными...')

    // Получаем существующие типы
    const existingData = await pool.query('SELECT name FROM types')
    const existingNames = existingData.rows.map(row => row.name)

    // Тестовые данные для типов
    const testTypes = [
      { name: 'Инцидент', comment: 'Проблема, требующая немедленного решения', isActive: true },
      { name: 'Запрос на обслуживание', comment: 'Стандартный запрос на предоставление информации или услуги', isActive: true },
      { name: 'Проблема', comment: 'Корневая причина инцидентов', isActive: true },
      { name: 'Изменение', comment: 'Запрос на изменение в системе', isActive: true },
      { name: 'Задача', comment: 'Общая задача или поручение', isActive: true },
      { name: 'Уведомление', comment: 'Информационное сообщение', isActive: true },
      { name: 'Жалоба', comment: 'Выражение недовольства качеством обслуживания', isActive: true },
      { name: 'Предложение', comment: 'Предложение по улучшению', isActive: true },
      { name: 'Консультация', comment: 'Запрос на консультацию', isActive: true },
      { name: 'Техническая поддержка', comment: 'Запрос технической помощи', isActive: true },
    ]

    let addedCount = 0

    console.log('📝 Вставка тестовых данных...')

    for (const type of testTypes) {
      if (!existingNames.includes(type.name)) {
        await Types.create(type)
        console.log(`   ✅ Добавлен тип: ${type.name}`)
        addedCount++
      }
      else {
        console.log(`   ℹ️  Тип "${type.name}" уже существует, пропускаем`)
      }
    }

    console.log('✅ Наполнение таблицы types завершено успешно')
    console.log(`   Добавлено ${addedCount} новых тестовых записей`)

    process.exit(0)
  }
  catch (error) {
    console.error('❌ Ошибка наполнения таблицы types:', error)
    process.exit(1)
  }
}

initTypesTable()
