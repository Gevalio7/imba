const fs = require('fs');
const path = require('path');

// Создаём директорию models, если она не существует
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Читаем извлечённые интерфейсы из файла
const configPath = path.join(__dirname, 'extracted-interfaces.json');
if (!fs.existsSync(configPath)) {
  console.error('Файл extracted-interfaces.json не найден!');
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Ошибка чтения или парсинга extracted-interfaces.json:', error.message);
  process.exit(1);
}

if (typeof config !== 'object' || config === null) {
  console.error('Файл extracted-interfaces.json не содержит валидный объект!');
  process.exit(1);
}

const entities = Object.keys(config);
if (entities.length === 0) {
  console.log('В extracted-interfaces.json нет сущностей для генерации моделей.');
  process.exit(0);
}

function toSnakeCase(str) {
  // Специальная обработка для sLA -> sla
  if (str === 'sLA') {
    return 'sla';
  }
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

function singularize(str) {
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
  if (str.endsWith('s')) return str.slice(0, -1);
  return str;
}

function generateModel(entity) {
  const tableName = toSnakeCase(entity);
  // Для sLA используем SLA как имя класса
  const className = entity === 'sLA' ? 'SLA' : entity;
  const singular = singularize(entity).toLowerCase();
  const fileName = entity.charAt(0).toLowerCase() + entity.slice(1) + '.js';

  const fieldList = Object.keys(config[entity]).filter(f => !['status', 'isActive'].includes(f));
  const fields = fieldList.join(', ');

  const code = `const { pool } = require('../config/db');

class ${className} {
  static tableName = '${tableName}';
  static fields = '${fields}';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (q) {
        const searchFields = this.fields.split(', ');
        const conditions = searchFields.map(field => \`\${field.toLowerCase()} ILIKE $\${paramIndex}\`).join(' OR ');
        whereClause = \`WHERE \${conditions}\`;
        params.push(\`%\${q}%\`);
        paramIndex++;
      }

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at']);
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = \`ORDER BY \${sortBy} \${orderBy === 'desc' ? 'DESC' : 'ASC'}\`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = \`SELECT COUNT(*) as total FROM \${${className}.tableName} \${whereClause}\`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      // Преобразуем имена полей в lowercase для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const lower = f.toLowerCase();
        return lower === f ? f : \`\${lower} as "\${f}"\`;
      }).join(', ');
      const dataQuery = \`SELECT id, \${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM \${${className}.tableName} \${whereClause} \${orderClause} LIMIT $\${paramIndex} OFFSET $\${paramIndex + 1}\`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        ${entity}: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      // Преобразуем имена полей в lowercase для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const lower = f.toLowerCase();
        return lower === f ? f : \`\${lower} as "\${f}"\`;
      }).join(', ');
      const result = await pool.query(
        \`SELECT id, \${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM \${${className}.tableName} WHERE id = $1\`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(${singular}) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => \`$\${i + 1}\`).join(', ');
      const values = fieldList.map(field => ${singular}[field]);
      
      // Добавляем status и isActive
      values.push(${singular}.status || 1);
      values.push(${singular}.isActive !== undefined ? ${singular}.isActive : true);
      
      // Преобразуем имена полей в lowercase для SQL
      const sqlFieldsInsert = fieldList.map(f => f.toLowerCase()).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const lower = f.toLowerCase();
        return lower === f ? f : \`\${lower} as "\${f}"\`;
      }).join(', ');
      
      const query = \`INSERT INTO \${${className}.tableName} (\${sqlFieldsInsert}, status, is_active) VALUES (\${placeholders}, $\${fieldList.length + 1}, $\${fieldList.length + 2}) RETURNING id, \${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"\`;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, ${singular}) {
    try {
      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (${singular}[field] !== undefined) {
          updates.push(\`\${field.toLowerCase()} = $\${paramIndex}\`);
          values.push(${singular}[field]);
          paramIndex++;
        }
      });

      // Добавляем status если передан
      if (${singular}.status !== undefined) {
        updates.push(\`status = $\${paramIndex}\`);
        values.push(${singular}.status);
        paramIndex++;
      }

      // Добавляем isActive если передан
      if (${singular}.isActive !== undefined) {
        updates.push(\`is_active = $\${paramIndex}\`);
        values.push(${singular}.isActive);
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Добавляем id в конец
      values.push(id);

      // Преобразуем имена полей в lowercase для SQL
      const sqlFields = fieldList.map(f => {
        const lower = f.toLowerCase();
        return lower === f ? f : \`\${lower} as "\${f}"\`;
      }).join(', ');

      const query = \`UPDATE \${${className}.tableName} SET \${updates.join(', ')} WHERE id = $\${paramIndex} RETURNING id, \${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"\`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(\`DELETE FROM \${${className}.tableName} WHERE id = $1\`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = ${className};
`;

  const filePath = path.join(__dirname, 'models', fileName);
  fs.writeFileSync(filePath, code);
  console.log(`Generated ${filePath}`);
}

entities.forEach(entity => {
  generateModel(entity);
});

console.log('All models generated.');
