const { pool } = require('./config/db');
const fs = require('fs');
const path = require('path');

/**
 * Скрипт применения SQL миграций к базе данных
 * 
 * Использование: node apply-migrations.js --force
 * 
 * Выполняет:
 * 1. Удаление всех существующих таблиц (drop-all-tables.sql)
 * 2. Создание новых таблиц (create-all-tables.sql)
 */

const migrationsDir = path.join(__dirname, 'migrations');

// Проверяем наличие файлов миграций
const dropFilePath = path.join(migrationsDir, 'drop-all-tables.sql');
const createFilePath = path.join(migrationsDir, 'create-all-tables.sql');

if (!fs.existsSync(dropFilePath) || !fs.existsSync(createFilePath)) {
  console.error('❌ Файлы миграций не найдены!');
  console.log('💡 Сначала запустите: node generate-sql-tables.js');
  process.exit(1);
}

// Функция для выполнения SQL файла
async function executeSQLFile(filePath, description) {
  console.log(`\n📄 Выполнение: ${description}`);
  console.log(`   Файл: ${path.relative(process.cwd(), filePath)}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Выполняем весь SQL файл как одну транзакцию
    console.log(`   Выполнение SQL скрипта...`);
    
    await pool.query(sql);
    
    console.log(`   ✅ SQL скрипт выполнен успешно`);
    
    return { success: true };
  } catch (error) {
    console.error(`   ❌ Ошибка выполнения SQL:`, error.message);
    
    // Показываем детали ошибки
    if (error.position) {
      const position = parseInt(error.position);
      const snippet = sql.substring(Math.max(0, position - 100), position + 100);
      console.error(`   Позиция ошибки: ${position}`);
      console.error(`   Фрагмент: ...${snippet}...`);
    }
    
    return { success: false, error };
  }
}

// Функция для получения списка таблиц
async function getTablesList() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Ошибка получения списка таблиц:', error.message);
    return [];
  }
}

// Основная функция
async function main() {
  console.log('🚀 Применение миграций к базе данных...\n');
  
  try {
    // Проверяем подключение к БД
    console.log('🔌 Проверка подключения к базе данных...');
    await pool.query('SELECT NOW()');
    console.log('✅ Подключение установлено\n');
    
    // Показываем текущие таблицы
    console.log('📊 Текущие таблицы в базе данных:');
    const tablesBefore = await getTablesList();
    if (tablesBefore.length > 0) {
      tablesBefore.forEach(table => console.log(`   - ${table}`));
      console.log(`   Всего: ${tablesBefore.length} таблиц`);
    } else {
      console.log('   (нет таблиц)');
    }
    
    // Запрашиваем подтверждение
    console.log('\n⚠️  ВНИМАНИЕ: Все существующие таблицы будут удалены!');
    console.log('   Это действие необратимо. Все данные будут потеряны.');
    
    // В production окружении требуем явного подтверждения
    if (process.env.NODE_ENV === 'production') {
      console.log('\n❌ Миграция в production окружении запрещена!');
      console.log('   Используйте ручное выполнение SQL скриптов.');
      process.exit(1);
    }
    
    // Для автоматического выполнения можно передать флаг --force
    const forceMode = process.argv.includes('--force');
    
    if (!forceMode) {
      console.log('\n💡 Для автоматического выполнения используйте: node apply-migrations.js --force');
      console.log('   Или выполните SQL скрипты вручную.');
      process.exit(0);
    }
    
    console.log('\n🔄 Начинаем миграцию...\n');
    
    // Шаг 1: Удаление таблиц
    const dropResult = await executeSQLFile(dropFilePath, 'Удаление существующих таблиц');
    
    if (!dropResult.success) {
      console.error('\n❌ Не удалось удалить таблицы');
      console.log('💡 Возможно, некоторые таблицы не существуют - это нормально для первого запуска');
    }
    
    // Шаг 2: Создание таблиц
    const createResult = await executeSQLFile(createFilePath, 'Создание новых таблиц');
    
    if (!createResult.success) {
      throw new Error('Не удалось создать таблицы');
    }
    
    // Показываем новые таблицы
    console.log('\n📊 Таблицы после миграции:');
    const tablesAfter = await getTablesList();
    if (tablesAfter.length > 0) {
      tablesAfter.forEach(table => console.log(`   - ${table}`));
      console.log(`   Всего: ${tablesAfter.length} таблиц`);
    } else {
      console.log('   (нет таблиц)');
    }
    
    // Итоговая статистика
    console.log('\n📈 Статистика миграции:');
    console.log(`   Удалено таблиц: ${tablesBefore.length}`);
    console.log(`   Создано таблиц: ${tablesAfter.length}`);
    
    console.log('\n✨ Миграция завершена успешно!');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Проверьте структуру таблиц в БД');
    console.log('2. Запустите извлечение из БД: node extract-from-db.js');
    console.log('3. Сгенерируйте модели и контроллеры: node generate-all.js --skip-db');
    
  } catch (error) {
    console.error('\n❌ Ошибка при применении миграций:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Закрываем подключение к БД
    await pool.end();
  }
}

// Обработка сигналов завершения
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Получен сигнал прерывания');
  console.log('Закрываем подключение к БД...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Получен сигнал завершения');
  console.log('Закрываем подключение к БД...');
  await pool.end();
  process.exit(0);
});

// Запускаем
main().catch(async (error) => {
  console.error('Критическая ошибка:', error);
  await pool.end();
  process.exit(1);
});
