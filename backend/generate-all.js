#!/usr/bin/env node

/**
 * Главный скрипт для генерации всего бэкенда
 * 
 * Новый поток работы:
 * 1. Извлечение интерфейсов из Vue файлов
 * 2. Генерация SQL скриптов для создания таблиц
 * 3. Применение миграций к БД (удаление старых таблиц + создание новых)
 * 4. Извлечение структуры из БД
 * 5. Генерация моделей, контроллеров, роутов
 * 6. Обновление Vue страниц с API интеграцией
 * 
 * Использование:
 *   node generate-all.js              - интерактивный режим
 *   node generate-all.js --force      - автоматическое выполнение
 *   node generate-all.js --skip-db    - пропустить миграцию БД
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Парсим аргументы командной строки
const args = process.argv.slice(2);
const forceMode = args.includes('--force');
const skipDB = args.includes('--skip-db');

console.log('🚀 Генерация полного стека (Frontend + Backend)...\n');

// Проверяем наличие необходимых файлов
const requiredFiles = [
  'extract-interfaces.js',
  'generate-sql-tables.js',
  'apply-migrations.js',
  'extract-from-db.js',
  'generate-models.js',
  'generate-controllers.js',
  'generate-routes.js',
  'generate-vue-pages.js',
];

console.log('🔍 Проверка наличия необходимых файлов...');
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.error(`❌ Файл ${file} не найден!`);
    process.exit(1);
  }
}
console.log('✅ Все файлы на месте\n');

// Функция для выполнения команды с обработкой ошибок
function runCommand(command, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📌 ${description}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`\n✅ ${description} - завершено успешно`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${description} - ошибка выполнения`);
    console.error(`Команда: ${command}`);
    console.error(`Код ошибки: ${error.status}`);
    return false;
  }
}

// Функция для проверки существования файла
function checkFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${description} не найден: ${filePath}`);
    return false;
  }
  console.log(`✅ ${description} найден`);
  return true;
}

// Функция для получения статистики
function getStats() {
  const stats = {
    interfaces: 0,
    models: 0,
    controllers: 0,
    routes: 0,
    vuePages: 0
  };
  
  // Подсчитываем интерфейсы
  const interfacesPath = path.join(__dirname, 'extracted-interfaces.json');
  if (fs.existsSync(interfacesPath)) {
    const data = JSON.parse(fs.readFileSync(interfacesPath, 'utf8'));
    stats.interfaces = Object.keys(data).length;
  }
  
  // Подсчитываем модели
  const modelsDir = path.join(__dirname, 'models');
  if (fs.existsSync(modelsDir)) {
    stats.models = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js')).length;
  }
  
  // Подсчитываем контроллеры
  const controllersDir = path.join(__dirname, 'controllers');
  if (fs.existsSync(controllersDir)) {
    stats.controllers = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js')).length;
  }
  
  // Подсчитываем роуты
  const routesDir = path.join(__dirname, 'routes');
  if (fs.existsSync(routesDir)) {
    stats.routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js')).length;
  }
  
  return stats;
}

// Основная функция
async function main() {
  const startTime = Date.now();
  
  try {
    // ========================================
    // Шаг 1: Извлечение интерфейсов из Vue
    // ========================================
    if (!runCommand('node extract-interfaces.js', 'Шаг 1: Извлечение интерфейсов из Vue файлов')) {
      throw new Error('Не удалось извлечь интерфейсы');
    }
    
    // Проверяем результат
    const extractedPath = path.join(__dirname, 'extracted-interfaces.json');
    if (!checkFileExists(extractedPath, 'Файл extracted-interfaces.json')) {
      throw new Error('Файл extracted-interfaces.json не был создан');
    }
    
    const extractedData = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
    const entityCount = Object.keys(extractedData).length;
    console.log(`\n📊 Извлечено сущностей: ${entityCount}`);
    
    if (entityCount === 0) {
      console.log('\n⚠️  Не найдено ни одной сущности для генерации');
      console.log('💡 Проверьте наличие интерфейсов в Vue файлах');
      process.exit(0);
    }
    
    // ========================================
    // Шаг 2: Генерация SQL скриптов
    // ========================================
    if (!runCommand('node generate-sql-tables.js', 'Шаг 2: Генерация SQL скриптов для таблиц')) {
      throw new Error('Не удалось сгенерировать SQL скрипты');
    }
    
    // Проверяем результат
    const migrationsDir = path.join(__dirname, 'migrations');
    const dropSQL = path.join(migrationsDir, 'drop-all-tables.sql');
    const createSQL = path.join(migrationsDir, 'create-all-tables.sql');
    
    if (!checkFileExists(dropSQL, 'SQL скрипт удаления таблиц') ||
        !checkFileExists(createSQL, 'SQL скрипт создания таблиц')) {
      throw new Error('SQL скрипты не были созданы');
    }
    
    // ========================================
    // Шаг 3: Применение миграций к БД
    // ========================================
    if (!skipDB) {
      console.log('\n⚠️  ВНИМАНИЕ: Следующий шаг удалит все таблицы в БД!');
      
      if (!forceMode) {
        console.log('\n💡 Для автоматического выполнения используйте: node generate-all.js --force');
        console.log('   Или пропустите миграцию БД: node generate-all.js --skip-db');
        console.log('\n❌ Миграция БД пропущена. Запустите вручную:');
        console.log('   node apply-migrations.js --force');
        console.log('\nГенерация остановлена.');
        process.exit(0);
      }
      
      if (!runCommand('node apply-migrations.js --force', 'Шаг 3: Применение миграций к БД')) {
        throw new Error('Не удалось применить миграции');
      }
    } else {
      console.log('\n⏭️  Шаг 3: Миграция БД пропущена (--skip-db)');
    }
    
    // ========================================
    // Шаг 4: Извлечение структуры из БД
    // ========================================
    if (!skipDB) {
      if (!runCommand('node extract-from-db.js', 'Шаг 4: Извлечение структуры из БД')) {
        throw new Error('Не удалось извлечь структуру из БД');
      }
      
      // Проверяем обновленный файл
      const updatedData = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
      const updatedCount = Object.keys(updatedData).length;
      console.log(`\n📊 Обновлено сущностей из БД: ${updatedCount}`);
    } else {
      console.log('\n⏭️  Шаг 4: Извлечение из БД пропущено (--skip-db)');
    }
    
    // ========================================
    // Шаг 5: Генерация моделей
    // ========================================
    if (!runCommand('node generate-models.js', 'Шаг 5: Генерация моделей')) {
      throw new Error('Не удалось сгенерировать модели');
    }
    
    // ========================================
    // Шаг 6: Генерация контроллеров
    // ========================================
    if (!runCommand('node generate-controllers.js', 'Шаг 6: Генерация контроллеров')) {
      throw new Error('Не удалось сгенерировать контроллеры');
    }
    
    // ========================================
    // Шаг 7: Генерация роутов
    // ========================================
    if (!runCommand('node generate-routes.js', 'Шаг 7: Генерация роутов')) {
      throw new Error('Не удалось сгенерировать роуты');
    }
    
    // ========================================
    // Шаг 8: Обновление Vue страниц
    // ========================================
    if (!runCommand('node generate-vue-pages.js', 'Шаг 8: Обновление Vue страниц с API интеграцией')) {
      throw new Error('Не удалось обновить Vue страницы');
    }
    
    // ========================================
    // Итоговая статистика
    // ========================================
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const stats = getStats();
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ ГЕНЕРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');
    console.log('='.repeat(60));
    
    console.log('\n📊 Статистика:');
    console.log(`   ⏱️  Время выполнения: ${duration} сек`);
    console.log(`   📝 Интерфейсов: ${stats.interfaces}`);
    console.log(`   🗄️  Моделей: ${stats.models}`);
    console.log(`   🎮 Контроллеров: ${stats.controllers}`);
    console.log(`   🛣️  Роутов: ${stats.routes}`);
    
    console.log('\n📁 Сгенерированные файлы:');
    console.log(`   📄 backend/extracted-interfaces.json`);
    console.log(`   📄 backend/migrations/drop-all-tables.sql`);
    console.log(`   📄 backend/migrations/create-all-tables.sql`);
    console.log(`   📂 backend/models/ (${stats.models} файлов)`);
    console.log(`   📂 backend/controllers/ (${stats.controllers} файлов)`);
    console.log(`   📂 backend/routes/ (${stats.routes} файлов)`);
    console.log(`   📂 src/pages/apps/settings/ (Vue страницы обновлены)`);
    
    console.log('\n📋 Следующие шаги:');
    console.log('1. ✅ Проверьте сгенерированные файлы');
    console.log('2. ✅ Проверьте структуру таблиц в БД');
    console.log('3. 🚀 Запустите сервер: npm run dev');
    console.log('4. 🌐 Откройте приложение в браузере');
    console.log('5. 🧪 Протестируйте CRUD операции');
    
    console.log('\n💡 Полезные команды:');
    console.log('   npm run dev              - запуск dev сервера');
    console.log('   npm run build            - сборка для production');
    console.log('   node backend/server.js   - запуск backend сервера');
    
    if (skipDB) {
      console.log('\n⚠️  Напоминание: Миграция БД была пропущена');
      console.log('   Для применения изменений в БД выполните:');
      console.log('   node apply-migrations.js --force');
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ОШИБКА ПРИ ГЕНЕРАЦИИ');
    console.error('='.repeat(60));
    console.error(`\n${error.message}`);
    
    if (error.stack) {
      console.error('\nСтек вызовов:');
      console.error(error.stack);
    }
    
    console.error('\n💡 Советы по устранению:');
    console.error('1. Проверьте логи выше для деталей ошибки');
    console.error('2. Убедитесь, что БД доступна (если используется)');
    console.error('3. Проверьте файл .env с настройками подключения');
    console.error('4. Запустите отдельные шаги вручную для диагностики');
    
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Получен сигнал прерывания (Ctrl+C)');
  console.log('Генерация прервана пользователем');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Получен сигнал завершения');
  console.log('Генерация прервана');
  process.exit(143);
});

// Запускаем
main().catch((error) => {
  console.error('\n❌ Критическая ошибка:', error.message);
  process.exit(1);
});
