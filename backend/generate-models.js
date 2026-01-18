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
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

function singularize(str) {
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
  if (str.endsWith('s')) return str.slice(0, -1);
  return str;
}

function generateModel(entity) {
  const tableName = toSnakeCase(entity);
  const className = entity;
  const singular = singularize(entity).toLowerCase();
  const fileName = entity.charAt(0).toLowerCase() + entity.slice(1) + '.js';

  const fieldList = Object.keys(config[entity]);
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
        const conditions = searchFields.map(field => field + ' ILIKE $' + paramIndex).join(' OR ');
        whereClause = "WHERE " + conditions;
        params.push('%' + q + '%');
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
      const dataQuery = \`SELECT id, \${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM \${${className}.tableName} \${whereClause} \${orderClause} LIMIT \$\${paramIndex} OFFSET \$\${paramIndex + 1}\`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        ${tableName}: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(\`SELECT id, \${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM \${${className}.tableName} WHERE id = \$1\`, [id]);

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
      values.push(${singular}.status || 1, ${singular}.isActive !== undefined ? ${singular}.isActive : true);
      const result = await pool.query(\`INSERT INTO \${${className}.tableName} (\${this.fields}, status, is_active) VALUES (\${placeholders}, \$\${fieldList.length + 1}, \$\${fieldList.length + 2}) RETURNING id, \${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"\`, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, ${singular}) {
    try {
      const fieldList = this.fields.split(', ');
      const setClause = fieldList.map((field, i) => \`\${field} = \$\${i + 1}\`).join(', ');
      const values = fieldList.map(field => ${singular}[field]);
      values.push(${singular}.status !== undefined ? ${singular}.status : undefined, ${singular}.isActive !== undefined ? ${singular}.isActive : undefined, id);
      const result = await pool.query(\`UPDATE \${${className}.tableName} SET \${setClause}\${${singular}.status !== undefined ? ', status = \$\${fieldList.length + 1}' : ''}\${${singular}.isActive !== undefined ? ', is_active = \$\${fieldList.length + ' + (${singular}.status !== undefined ? 2 : 1) + '}' : ''}, updated_at = CURRENT_TIMESTAMP WHERE id = \$\${fieldList.length + ' + (${singular}.status !== undefined && ${singular}.isActive !== undefined ? 3 : ${singular}.status !== undefined || ${singular}.isActive !== undefined ? 2 : 1) + '} RETURNING id, \${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"\`, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(\`DELETE FROM \${${className}.tableName} WHERE id = \$1\`, [id]);

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
