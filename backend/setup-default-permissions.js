const { pool } = require('./config/db');

/**
 * Скрипт для установки дефолтных разрешений для ролей
 */

async function setupDefaultPermissions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🔧 Установка дефолтных разрешений для ролей...');

    // Дефолтные разрешения для разных ролей
    const rolePermissions = {
      // Администратор - все права
      'Администратор': {
        super_user: true,
        create_ticket: true,
        see_all_tickets: true,
        reply_to_tickets: true,
        internal_notes: true,
        change_status: true,
        kb_read: true,
        kb_write: true,
        view_reports: true,
        system_settings: true,
        manage_users: true,
      },
      
      // Специалист - базовые права для работы с тикетами
      'Специалист': {
        create_ticket: true,
        see_own_tickets: true,
        see_department_tickets: true,
        reply_to_tickets: true,
        internal_notes: true,
        change_status: true,
        kb_read: true,
      },
      
      // Младший специалист - ограниченные права
      'Младший специалист': {
        create_ticket: true,
        see_own_tickets: true,
        reply_to_tickets: true,
        kb_read: true,
      },
      
      // Менеджер - управление и отчеты
      'Менеджер': {
        create_ticket: true,
        see_all_tickets: true,
        reply_to_tickets: true,
        internal_notes: true,
        change_status: true,
        kb_read: true,
        kb_write: true,
        view_reports: true,
      },
      
      // Агент поддержки
      'Агент поддержки': {
        create_ticket: true,
        see_department_tickets: true,
        reply_to_tickets: true,
        internal_notes: true,
        change_status: true,
        kb_read: true,
      },
      
      // Супервизор
      'Супервизор': {
        create_ticket: true,
        see_all_tickets: true,
        reply_to_tickets: true,
        internal_notes: true,
        change_status: true,
        kb_read: true,
        kb_write: true,
        view_reports: true,
        manage_users: true,
      },
      
      // Технический специалист
      'Технический специалист': {
        create_ticket: true,
        see_department_tickets: true,
        reply_to_tickets: true,
        internal_notes: true,
        change_status: true,
        kb_read: true,
        kb_write: true,
      },
      
      // Консультант
      'Консультант': {
        create_ticket: true,
        see_own_tickets: true,
        reply_to_tickets: true,
        kb_read: true,
      },
      
      // Аналитик
      'Аналитик': {
        see_all_tickets: true,
        kb_read: true,
        view_reports: true,
      },
    };

    // Получаем все роли
    const rolesResult = await client.query('SELECT id, name FROM roles ORDER BY id');
    const roles = rolesResult.rows;

    console.log(`📊 Найдено ${roles.length} ролей`);

    for (const role of roles) {
      const permissions = rolePermissions[role.name];
      
      if (!permissions) {
        console.log(`⚠️  Нет дефолтных разрешений для роли "${role.name}" (ID ${role.id})`);
        continue;
      }

      console.log(`\n🔑 Настройка разрешений для роли "${role.name}" (ID ${role.id})...`);

      // Удаляем старые разрешения
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [role.id]);

      // Добавляем новые разрешения
      let grantedCount = 0;
      for (const [permission, isGranted] of Object.entries(permissions)) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission, is_granted) 
           VALUES ($1, $2, $3)
           ON CONFLICT (role_id, permission) DO UPDATE SET is_granted = $3`,
          [role.id, permission, isGranted]
        );
        if (isGranted) grantedCount++;
      }

      console.log(`✅ Добавлено ${grantedCount} разрешений для роли "${role.name}"`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Все разрешения успешно настроены!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка установки разрешений:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Запуск
if (require.main === module) {
  setupDefaultPermissions()
    .then(() => {
      console.log('🎉 Установка разрешений завершена');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { setupDefaultPermissions };
