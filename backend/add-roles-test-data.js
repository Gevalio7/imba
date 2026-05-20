const { pool } = require('./config/db')

async function addRolesTestData() {
  try {
    console.log('🔄 Добавление тестовых данных ролей...')

    // Тестовые роли
    const roles = [
      {
        name: 'Администратор',
        message: 'Полный доступ ко всем функциям системы',
        is_active: true,
      },
      {
        name: 'Менеджер',
        message: 'Управление пользователями и настройками',
        is_active: true,
      },
      {
        name: 'Агент поддержки',
        message: 'Работа с тикетами и обращениями клиентов',
        is_active: true,
      },
      {
        name: 'Аналитик',
        message: 'Просмотр отчетов и статистики',
        is_active: true,
      },
      {
        name: 'Оператор',
        message: 'Базовые операции с тикетами',
        is_active: true,
      },
      {
        name: 'Супервизор',
        message: 'Контроль работы агентов поддержки',
        is_active: true,
      },
      {
        name: 'Технический специалист',
        message: 'Решение технических вопросов',
        is_active: false,
      },
      {
        name: 'Консультант',
        message: 'Консультации клиентов по продуктам',
        is_active: true,
      },
    ]

    for (const role of roles) {
      // Проверяем, существует ли роль с таким именем
      const existingRole = await pool.query('SELECT id FROM roles WHERE name = $1', [role.name])

      if (existingRole.rows.length === 0) {
        await pool.query(`INSERT INTO roles (name, message, is_active)
          VALUES ($1, $2, $3)`,
        [role.name, role.message, role.is_active],
        )
      }
    }

    console.log('✅ Добавлены тестовые роли')
    console.log('✅ Все тестовые данные ролей добавлены успешно')
    process.exit(0)
  }
  catch (err) {
    console.error('❌ Ошибка:', err)
    process.exit(1)
  }
}

addRolesTestData()
