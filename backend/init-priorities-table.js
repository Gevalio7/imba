const { pool } = require('./config/db')
const Priorities = require('./models/priorities')

async function initPrioritiesTable() {
  try {
    console.log('🔄 Проверка и наполнение таблицы priorities тестовыми данными...')

    // Получаем существующие приоритеты
    const existingData = await pool.query('SELECT name FROM priorities')
    const existingNames = existingData.rows.map(row => row.name)

    // Тестовые данные для приоритетов
    const testPriorities = [
      { name: 'Низкий', color: '#28a745', isActive: true },
      { name: 'Средний', color: '#ffc107', isActive: true },
      { name: 'Высокий', color: '#dc3545', isActive: true },
      { name: 'Критический', color: '#6f42c1', isActive: true },
      { name: 'Очень низкий', color: '#17a2b8', isActive: true },
      { name: 'Очень высокий', color: '#e83e8c', isActive: true },
      { name: 'Срочный', color: '#fd7e14', isActive: true },
      { name: 'Блокирующий', color: '#343a40', isActive: true },
      { name: 'Нормальный', color: '#007bff', isActive: true },
      { name: 'Минимальный', color: '#6c757d', isActive: true },
    ]

    let addedCount = 0

    console.log('📝 Вставка тестовых данных...')

    for (const priority of testPriorities) {
      if (!existingNames.includes(priority.name)) {
        await Priorities.create(priority)
        console.log(`   ✅ Добавлен приоритет: ${priority.name}`)
        addedCount++
      }
      else {
        console.log(`   ℹ️  Приоритет "${priority.name}" уже существует, пропускаем`)
      }
    }

    console.log('✅ Наполнение таблицы priorities завершено успешно')
    console.log(`   Добавлено ${addedCount} новых тестовых записей`)

    process.exit(0)
  }
  catch (error) {
    console.error('❌ Ошибка наполнения таблицы priorities:', error)
    process.exit(1)
  }
}

initPrioritiesTable()
