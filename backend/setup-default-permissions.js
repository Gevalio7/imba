const { pool } = require('./config/db');
const Roles = require('./models/roles');

/**
 * Скрипт для установки дефолтных разрешений для ролей
 *
 * Единая модель: каждое разрешение имеет вид menu_<раздел>_<read|write|delete>.
 * Наличие menu_<раздел>_read означает, что пункт меню виден.
 * write/delete управляют доступностью операций создания/редактирования/удаления.
 */

// Хелперы наборов разрешений
const READ = 'read';
const WRITE = 'write';
const DEL = 'delete';

// Сгенерировать набор {code: true} для перечня разделов и операций.
// rwAll(['menu_chat']) -> { menu_chat_read: true, menu_chat_write: true, menu_chat_delete: true }
const rwAll = (bases) => {
  const out = {};
  for (const base of bases) {
    out[`${base}_${READ}`] = true;
    out[`${base}_${WRITE}`] = true;
    out[`${base}_${DEL}`] = true;
  }
  return out;
};

const readOnly = (bases) => {
  const out = {};
  for (const base of bases) out[`${base}_${READ}`] = true;
  return out;
};

const readWrite = (bases) => {
  const out = {};
  for (const base of bases) {
    out[`${base}_${READ}`] = true;
    out[`${base}_${WRITE}`] = true;
  }
  return out;
};

// Все базовые разделы меню (для администратора — полный доступ)
const ALL_MENU_BASES = Roles.getMenuItems().map((m) => m.base);

// Дефолтные level для каждого разрешения (по getAvailablePermissions).
// Используется при создании новых строк, чтобы не сбрасывать level в NULL.
const DEFAULT_LEVELS = (() => {
  const map = new Map();
  for (const p of Roles.getAvailablePermissions()) {
    map.set(p.code, p.level);
  }
  return map;
})();

async function setupDefaultPermissions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🔧 Установка дефолтных разрешений для ролей (menu_* модель)...');

    const rolePermissions = {
      // Администратор — полный доступ ко всему меню
      'Администратор': rwAll(ALL_MENU_BASES),

      // Специалист — только база знаний (чтение)
      'Специалист': readOnly(['menu_knowledge_base']),

      // Младший специалист — только список тикетов и БЗ (чтение)
      'Младший специалист': readOnly(['menu_tickets_list', 'menu_knowledge_base']),

      // Менеджер — тикеты, БЗ, очереди (чтение/запись)
      'Менеджер': {
        ...readWrite(['menu_tickets_list', 'menu_tickets_create', 'menu_knowledge_base', 'menu_queues']),
      },

      // Агент поддержки — работа с тикетами и чтение БЗ
      'Агент поддержки': {
        ...readWrite(['menu_tickets_list', 'menu_tickets_create']),
        ...readOnly(['menu_knowledge_base', 'menu_chat']),
      },

      // Супервизор — расширенный доступ к тикетам и управлению агентами
      'Супервизор': {
        ...rwAll(['menu_tickets_list', 'menu_tickets_create', 'menu_tickets_schedules']),
        ...readWrite(['menu_agents', 'menu_knowledge_base', 'menu_queues']),
      },

      // Технический специалист — БЗ, агенты (чтение/запись)
      'Технический специалист': {
        ...readWrite(['menu_knowledge_base', 'menu_agents']),
        ...readOnly(['menu_tickets_list']),
      },

      // Консультант — БЗ и тикеты (только чтение)
      'Консультант': readOnly(['menu_knowledge_base', 'menu_tickets_list', 'menu_tickets_create']),

      // Аналитик — чтение тикетов и БЗ
      'Аналитик': readOnly(['menu_tickets_list', 'menu_knowledge_base']),
    };

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

      // Полностью пересобираем набор: удаляем старые и проставляем новые.
      // level задаём из defaults модели, чтобы не оставлять NULL.
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [role.id]);

      let grantedCount = 0;
      for (const [permission, isGranted] of Object.entries(permissions)) {
        const defaultLevel = DEFAULT_LEVELS.get(permission) ?? null;
        await client.query(
          `INSERT INTO role_permissions (role_id, permission, is_granted, level)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (role_id, permission)
           DO UPDATE SET is_granted = EXCLUDED.is_granted,
                         level = COALESCE(role_permissions.level, EXCLUDED.level),
                         updated_at = CURRENT_TIMESTAMP`,
          [role.id, permission, isGranted, defaultLevel]
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
