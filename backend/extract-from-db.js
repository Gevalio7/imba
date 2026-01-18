const { pool } = require('./config/db');
const fs = require('fs');
const path = require('path');

// Маппинг PostgreSQL типов на TypeScript типы
const typeMapping = {
  'integer': 'number',
  'bigint': 'number',
  'smallint': 'number',
  'numeric': 'number',
  'real': 'number',
  'double precision': 'number',
  'boolean': 'boolean',
  'character varying': 'string',
  'character': 'string',
  'text': 'string',
  'timestamp without time zone': 'string',
  'timestamp with time zone': 'string',
  'date': 'string',
  'time without time zone': 'string',
  'time with time zone': 'string',
  'json': 'any',
  'jsonb': 'any',
  'uuid': 'string',
  'ARRAY': 'string[]'
};

// Функция для преобразования snake_case в camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Функция для преобразования snake_case в PascalCase
function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

async function extractFromDatabase() {
  try {
    // Получаем список всех таблиц
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`Найдено таблиц: ${tables.length}`);
    
    const extractedData = {};
    
    for (const tableName of tables) {
      console.log(`\nОбработка таблицы: ${tableName}`);
      
      // Получаем структуру таблицы
      const columnsQuery = `
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      const columnsResult = await pool.query(columnsQuery, [tableName]);
      const columns = columnsResult.rows;
      
      // Преобразуем имя таблицы в имя сущности (PascalCase)
      const entityName = toPascalCase(tableName);
      
      const fields = {};
      
      for (const column of columns) {
        const columnName = column.column_name;
        
        // Пропускаем системные поля
        if (['id', 'created_at', 'updated_at'].includes(columnName)) {
          continue;
        }
        
        // Преобразуем имя колонки в camelCase
        const fieldName = toCamelCase(columnName);
        
        // Определяем тип поля
        let fieldType = typeMapping[column.data_type] || 'any';
        
        // Добавляем комментарий для специальных полей
        let typeComment = '';
        if (columnName === 'status') {
          typeComment = ' // 1 - активен, 2 - не активен';
        }
        
        fields[fieldName] = fieldType + typeComment;
        
        console.log(`  ${columnName} (${column.data_type}) -> ${fieldName}: ${fieldType}${typeComment}`);
      }
      
      if (Object.keys(fields).length > 0) {
        extractedData[entityName] = fields;
      }
    }
    
    // Сохраняем результаты
    const outputPath = path.join(__dirname, 'extracted-interfaces.json');
    fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2));
    
    console.log(`\n✅ Извлечено ${Object.keys(extractedData).length} сущностей`);
    console.log(`📄 Результаты сохранены в ${outputPath}`);
    
    return extractedData;
  } catch (error) {
    console.error('❌ Ошибка при извлечении данных из БД:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем извлечение
extractFromDatabase()
  .then(() => {
    console.log('\n✅ Извлечение завершено успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });
