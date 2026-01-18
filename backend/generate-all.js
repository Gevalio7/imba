#!/usr/bin/env node

/**
 * Главный скрипт для генерации всего бэкенда
 * Запускает все генераторы в правильном порядке
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Начинаем генерацию бэкенда...\n');

// Проверяем наличие необходимых файлов
const requiredFiles = [
  'extract-interfaces.js',
  'generate-models.js',
  'generate-controllers.js',
  'generate-routes.js',
  'generate-vue-pages.js',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.error(`❌ Файл ${file} не найден!`);
    process.exit(1);
  }
}

try {
  // Шаг 1: Извлечение интерфейсов из Vue файлов
  console.log('📝 Шаг 1: Извлечение интерфейсов из Vue файлов...');
  execSync('node extract-interfaces.js', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Интерфейсы извлечены\n');

  // Проверяем, что файл extracted-interfaces.json создан
  const extractedPath = path.join(__dirname, 'extracted-interfaces.json');
  if (!fs.existsSync(extractedPath)) {
    console.error('❌ Файл extracted-interfaces.json не был создан!');
    process.exit(1);
  }

  const extractedData = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
  const entityCount = Object.keys(extractedData).length;
  console.log(`📊 Найдено сущностей: ${entityCount}\n`);

  // Шаг 2: Генерация моделей
  console.log('🗄️  Шаг 2: Генерация моделей...');
  execSync('node generate-models.js', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Модели сгенерированы\n');

  // Шаг 3: Генерация контроллеров
  console.log('🎮 Шаг 3: Генерация контроллеров...');
  execSync('node generate-controllers.js', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Контроллеры сгенерированы\n');

  // Шаг 4: Генерация роутов
  console.log('🛣️  Шаг 4: Генерация роутов...');
  execSync('node generate-routes.js', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Роуты сгенерированы\n');

  // Шаг 5: Генерация Vue страниц
  console.log('🎨 Шаг 5: Генерация Vue страниц с API интеграцией...');
  execSync('node generate-vue-pages.js', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Vue страницы сгенерированы\n');

  console.log('� Генерация бэкенда и фронтенда завершена успешно!');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Проверьте сгенерированные файлы в папках models/, controllers/, routes/');
  console.log('2. Проверьте сгенерированные Vue страницы в src/pages/apps/settings/');
  console.log('3. Запустите инициализацию БД: npm run init-db');
  console.log('4. Запустите сервер: npm run dev');
  console.log('\n💡 Совет: Проверьте файл .env для настройки подключения к БД');

} catch (error) {
  console.error('\n❌ Ошибка при генерации:', error.message);
  process.exit(1);
}
