const fs = require('node:fs')
const path = require('node:path')

/**
 * Генератор SQL скриптов для создания таблиц на основе extracted-interfaces.json
 *
 * Использование: node generate-sql-tables.js
 *
 * Создает:
 * - migrations/create-all-tables.sql - SQL скрипт для создания всех таблиц
 * - migrations/drop-all-tables.sql - SQL скрипт для удаления всех таблиц
 */

// Читаем извлечённые интерфейсы
const configPath = path.join(__dirname, 'extracted-interfaces.json')
if (!fs.existsSync(configPath)) {
  console.error('❌ Файл extracted-interfaces.json не найден!')
  console.log('💡 Сначала запустите: node extract-interfaces.js')
  process.exit(1)
}

let config
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
}
catch (error) {
  console.error('❌ Ошибка чтения extracted-interfaces.json:', error.message)
  process.exit(1)
}

// Создаём директорию migrations
const migrationsDir = path.join(__dirname, 'migrations')
if (!fs.existsSync(migrationsDir))
  fs.mkdirSync(migrationsDir, { recursive: true })

// Функция преобразования camelCase в snake_case
function toSnakeCase(str) {
  // Специальная обработка для sLA -> sla
  if (str === 'sLA')
    return 'sla'

  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

// Маппинг TypeScript типов на PostgreSQL типы
function mapTypeToSQL(fieldType, fieldName) {
  // Удаляем комментарии из типа
  const cleanType = fieldType.split('//')[0].trim()

  // Обрабатываем специальные случаи
  if (fieldName === 'email')
    return 'VARCHAR(255)'
  if (fieldName === 'phone')
    return 'VARCHAR(50)'
  if (fieldName === 'zip' || fieldName === 'postalCode')
    return 'VARCHAR(20)'
  if (fieldName === 'color')
    return 'VARCHAR(7)' // для hex цветов

  // Базовые типы
  if (cleanType.includes('string[]'))
    return 'TEXT[]'
  if (cleanType.includes('number[]'))
    return 'INTEGER[]'
  if (cleanType.includes('string')) {
    // Для длинных текстов используем TEXT
    if (fieldName.includes('description')
        || fieldName.includes('comment')
        || fieldName.includes('message')
        || fieldName.includes('content')
        || fieldName.includes('response'))
      return 'TEXT'

    return 'VARCHAR(255)'
  }
  if (cleanType.includes('number'))
    return 'INTEGER'
  if (cleanType.includes('boolean'))
    return 'BOOLEAN'
  if (cleanType.includes('Date') || cleanType === 'string'
      && (fieldName.includes('Time') || fieldName.includes('Date') || fieldName.includes('At')))
    return 'TIMESTAMP'

  // По умолчанию
  return 'TEXT'
}

// Определяем, является ли поле обязательным
function isFieldRequired(fieldName) {
  // Обязательные поля
  const requiredFields = ['name', 'title', 'email', 'username']

  return requiredFields.includes(fieldName)
}

// Генерация SQL для создания таблицы
function generateCreateTableSQL(entityName, fields) {
  const tableName = toSnakeCase(entityName)

  let sql = `-- Таблица: ${tableName} (${entityName})\n`
  sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`
  sql += `  id SERIAL PRIMARY KEY,\n`

  // Добавляем поля из интерфейса
  for (const [fieldName, fieldType] of Object.entries(fields)) {
    // Пропускаем поля status и isActive - isActive будет добавлено как системное поле
    if (fieldName === 'status' || fieldName === 'isActive')
      continue

    const columnName = toSnakeCase(fieldName)
    const sqlType = mapTypeToSQL(fieldType, fieldName)
    const nullable = isFieldRequired(fieldName) ? 'NOT NULL' : ''
    const defaultValue = getDefaultValue(fieldName, fieldType)

    sql += `  ${columnName} ${sqlType} ${nullable}${defaultValue},\n`
  }

  // Добавляем системные поля
  sql += `  is_active BOOLEAN DEFAULT true,\n`
  sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`
  sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`
  sql += `);\n\n`

  // Добавляем индексы
  sql += generateIndexes(tableName, fields)

  // Добавляем триггер для updated_at
  sql += generateUpdateTrigger(tableName)

  return sql
}

// Генерация значения по умолчанию
function getDefaultValue(fieldName, fieldType) {
  if (fieldName === 'isActive')
    return ' DEFAULT true'
  if (fieldType.includes('boolean'))
    return ' DEFAULT false'
  if (fieldName.includes('count') || fieldName.includes('Count'))
    return ' DEFAULT 0'

  return ''
}

// Генерация индексов
function generateIndexes(tableName, fields) {
  let sql = ''

  // Индекс для поля name (если есть)
  if (fields.name)
    sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_name ON ${tableName}(name);\n`

  // Индекс для isActive (если есть)
  if (fields.isActive)
    sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_is_active ON ${tableName}(is_active);\n`

  // Индекс для email (если есть)
  if (fields.email)
    sql += `CREATE UNIQUE INDEX IF NOT EXISTS idx_${tableName}_email ON ${tableName}(email);\n`

  if (sql)
    sql += '\n'

  return sql
}

// Генерация триггера для автоматического обновления updated_at
function generateUpdateTrigger(tableName) {
  return `-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_${tableName}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_${tableName}_updated_at ON ${tableName};
CREATE TRIGGER trigger_update_${tableName}_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION update_${tableName}_updated_at();

\n`
}

// Генерация SQL для удаления таблицы
function generateDropTableSQL(entityName) {
  const tableName = toSnakeCase(entityName)

  return `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`
}

// Основная функция
function main() {
  console.log('🚀 Генерация SQL скриптов...\n')

  const entities = Object.keys(config)
  if (entities.length === 0) {
    console.log('⚠️  В extracted-interfaces.json нет сущностей')
    process.exit(0)
  }

  console.log(`📊 Найдено сущностей: ${entities.length}\n`)

  // Генерируем SQL для удаления таблиц
  let dropSQL = `-- ============================================
-- Скрипт удаления всех таблиц
-- Сгенерирован автоматически: ${new Date().toISOString()}
-- ============================================

-- Отключаем проверку внешних ключей
SET session_replication_role = 'replica';

`

  // Генерируем SQL для создания таблиц
  let createSQL = `-- ============================================
-- Скрипт создания всех таблиц
-- Сгенерирован автоматически: ${new Date().toISOString()}
-- Всего таблиц: ${entities.length}
-- ============================================

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`

  // Сначала удаляем все таблицы (в обратном порядке для внешних ключей)
  const reversedEntities = [...entities].reverse()
  for (const entityName of reversedEntities)
    dropSQL += generateDropTableSQL(entityName)

  dropSQL += `\n-- Включаем обратно проверку внешних ключей
SET session_replication_role = 'origin';\n`

  // Создаем таблицы
  for (const entityName of entities) {
    const fields = config[entityName]

    if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      console.log(`⏭️  Пропускаем ${entityName} (нет полей)`)
      continue
    }

    createSQL += generateCreateTableSQL(entityName, fields)
    console.log(`✅ Сгенерирован SQL для ${entityName}`)
  }

  // Сохраняем файлы
  const dropFilePath = path.join(migrationsDir, 'drop-all-tables.sql')
  const createFilePath = path.join(migrationsDir, 'create-all-tables.sql')

  fs.writeFileSync(dropFilePath, dropSQL)
  fs.writeFileSync(createFilePath, createSQL)

  console.log('\n📁 Файлы сохранены:')
  console.log(`   📄 ${path.relative(process.cwd(), dropFilePath)}`)
  console.log(`   📄 ${path.relative(process.cwd(), createFilePath)}`)

  console.log('\n✨ Генерация SQL скриптов завершена!')
  console.log('\n📋 Следующие шаги:')
  console.log('1. Проверьте сгенерированные SQL файлы в папке migrations/')
  console.log('2. Запустите миграцию: node apply-migrations.js')
  console.log('3. Или выполните вручную:')
  console.log('   psql -U your_user -d your_db -f migrations/drop-all-tables.sql')
  console.log('   psql -U your_user -d your_db -f migrations/create-all-tables.sql')
}

// Запускаем
try {
  main()
}
catch (error) {
  console.error('\n❌ Ошибка:', error.message)
  console.error(error.stack)
  process.exit(1)
}
