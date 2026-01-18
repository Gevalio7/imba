import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функция для чтения файла
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Ошибка чтения файла ${filePath}:`, error.message);
    return null;
  }
}

// Функция для извлечения интерфейсов из TypeScript кода
function extractInterfaces(content) {
  const interfaces = {};
  const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
  let match;

  console.log('Поиск интерфейсов в контенте...');

  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const interfaceBody = match[2];

    console.log(`Найден интерфейс: ${interfaceName}`);
    console.log(`Тело интерфейса: ${interfaceBody.substring(0, 200)}...`);

    // Извлекаем поля из интерфейса
    const fields = {};
    // Разбиваем тело интерфейса на строки и ищем поля
    const lines = interfaceBody.split('\n');
    console.log(`Всего строк в интерфейсе: ${lines.length}`);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`Строка ${i}: '${line}'`);
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('//')) {
        const fieldMatch = trimmedLine.match(/^\s*(\w+):\s*([^;]+)/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2].trim();
          console.log(`Найдено поле: ${fieldName} типа ${fieldType}`);
          // Пропускаем системные поля
          if (!['id', 'createdAt', 'updatedAt'].includes(fieldName)) {
            fields[fieldName] = fieldType;
          }
        }
      }
    }

    // Удаляем поле status если есть isActive (избегаем дублирования)
    if (fields.status && fields.isActive) {
      console.log(`⚠️  Удаляем дублирующееся поле 'status' (используется 'isActive')`);
      delete fields.status;
    }

    if (Object.keys(fields).length > 0) {
      interfaces[interfaceName] = fields;
      console.log(`Интерфейс ${interfaceName} имеет поля:`, fields);
    } else {
      console.log(`Интерфейс ${interfaceName} не имеет полей`);
    }
  }

  return interfaces;
}

// Функция для обработки директории
function processDirectory(dirPath) {
  const results = {};
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Рекурсивно обрабатываем подпапки
      console.log(`Обработка подпапки: ${file}`);
      const subResults = processDirectory(filePath);
      Object.assign(results, subResults);
    } else if (stat.isFile() && file.endsWith('.vue')) {
      console.log(`Обработка файла: ${file}`);
      const content = readFile(filePath);

      if (content) {
        const interfaces = extractInterfaces(content);

        // Определяем сущность по имени файла
        let entityName = file.replace('.vue', '');
        
        // Специальная обработка для SLA -> sLA
        if (entityName === 'SLA') {
          entityName = 'sLA';
        }

        // Ищем интерфейс с таким же именем или похожим
        const interfaceKeys = Object.keys(interfaces);
        let matchingInterface = null;

        // Сначала ищем точное совпадение
        if (interfaces[entityName]) {
          matchingInterface = entityName;
        } else {
          // Ищем интерфейс, который содержит имя файла (без s на конце)
          const singularEntityName = entityName.replace(/s$/, '');
          for (const key of interfaceKeys) {
            if (key.toLowerCase().includes(singularEntityName.toLowerCase()) ||
                singularEntityName.toLowerCase().includes(key.toLowerCase())) {
              matchingInterface = key;
              break;
            }
          }
        }

        if (matchingInterface) {
          results[entityName] = interfaces[matchingInterface];
          console.log(`Найден интерфейс ${matchingInterface} для ${entityName}:`, interfaces[matchingInterface]);
        } else if (interfaceKeys.length > 0) {
          // Если интерфейс найден, но не сопоставлен, берем первый
          const firstInterface = interfaceKeys[0];
          results[entityName] = interfaces[firstInterface];
          console.log(`Используем интерфейс ${firstInterface} для ${entityName}:`, interfaces[firstInterface]);
        } else {
          console.log(`Интерфейс не найден для ${entityName}`);
        }
      }
    }
  });

  return results;
}

// Функция для обновления entities-config.json
function updateEntitiesConfig(extractedData) {
  const configPath = 'entities-config.json';
  let config = {};

  // Читаем существующий конфиг
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  // Обновляем конфиг новыми данными
  for (const [entityName, fields] of Object.entries(extractedData)) {
    if (fields && typeof fields === 'object') {
      config[entityName] = fields;
    }
  }

  // Сохраняем обновленный конфиг
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`\nКонфиг обновлен в ${configPath}`);
}

// Основная функция
function main() {
  const ticketSettingsDir = '../src/pages/apps/settings';

  console.log('Начинаем обработку файлов...');
  const extractedData = processDirectory(ticketSettingsDir);

  console.log('\n=== Результаты ===');
  console.log(JSON.stringify(extractedData, null, 2));

  // Обновляем entities-config.json
  updateEntitiesConfig(extractedData);

  // Сохраняем результаты в файл для отладки
  fs.writeFileSync('extracted-interfaces.json', JSON.stringify(extractedData, null, 2));
  console.log('\nРезультаты сохранены в extracted-interfaces.json');
}

main();
