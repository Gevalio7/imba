const { pool } = require('./config/db')

// Список таблиц без подчеркиваний, которые нужно удалить
// (оставляем таблицы с подчеркиваниями как основные)
const tablesToDrop = [
  'acl', // оставляем acls или acl? Проверим
  'adminnotification',
  'agentsgroups',
  'agentsroles',
  'appointmentnotifications',
  'attachments', // может быть нужна
  'autoresponses',
  'calendars', // может быть нужна
  'communicationlog',
  'communicationnotificationssettings',
  'customerusers',
  'customeruserscustomers',
  'customerusersgroups',
  'customerusersservices',
  'customers', // может быть нужна
  'customersgroups',
  'dynamicfields',
  'dynamicfieldsscreens',
  'emailaddresses',
  'generalcatalog',
  'genericagent',
  'greetings', // может быть нужна
  'groups', // может быть нужна
  'oauth2',
  'packagemanager',
  'performancelog',
  'pgpkeys',
  'postmasterfilters',
  'postmastermailaccounts',
  'priorities', // может быть нужна
  'processesautomationsettings',
  'processmanagement',
  'queueautoresponse',
  'queues', // может быть нужна
  'roles', // может быть нужна
  'rolesgroups',
  'services', // может быть нужна
  'sessionmanagement',
  'signatures', // может быть нужна
  'sla', // может быть нужна
  'smimecertificates',
  'sqlbox',
  'states', // может быть нужна
  'systemconfiguration',
  'systemfilesupport',
  'systemlog',
  'systemmaintenance',
  'templateattachments', // удаляем, оставляем template_attachments
  'templatequeues', // удаляем, оставляем template_queues
  'templates', // может быть нужна
  'testentities',
  'ticketattributerelations',
  'ticketnotifications',
  'translation', // может быть нужна
  'usersgroupsrolessettings',
  'webservices',
]

async function removeDuplicateTables() {
  try {
    console.log('🔍 Проверка существующих таблиц...\n')

    // Получаем список всех таблиц
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    const existingTables = result.rows.map(row => row.table_name)

    console.log(`Всего таблиц в БД: ${existingTables.length}\n`)

    // Фильтруем только существующие таблицы
    const tablesToDropFiltered = tablesToDrop.filter(table => existingTables.includes(table))

    console.log(`Таблиц для удаления: ${tablesToDropFiltered.length}\n`)

    if (tablesToDropFiltered.length === 0) {
      console.log('✅ Нет таблиц для удаления')

      return
    }

    console.log('Будут удалены следующие таблицы:')
    tablesToDropFiltered.forEach(table => console.log(`  - ${table}`))
    console.log('')

    // Удаляем таблицы
    for (const table of tablesToDropFiltered) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
        console.log(`✅ Удалена таблица: ${table}`)
      }
      catch (error) {
        console.error(`❌ Ошибка при удалении таблицы ${table}:`, error.message)
      }
    }

    console.log(`\n✅ Удалено ${tablesToDropFiltered.length} таблиц`)
  }
  catch (error) {
    console.error('❌ Ошибка:', error)
    throw error
  }
  finally {
    await pool.end()
  }
}

// Запускаем удаление
removeDuplicateTables()
  .then(() => {
    console.log('\n✅ Очистка завершена успешно')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Ошибка:', error)
    process.exit(1)
  })
