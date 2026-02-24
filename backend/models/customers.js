const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class Customers {
  static tableName = 'customers';
  static fields = 'name, street, zip, city, comment';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (q) {
        const searchFields = this.fields.split(', ');
        const conditions = searchFields.map(field => `${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
        whereClause = `WHERE ${conditions}`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at']);
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${sortBy} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${Customers.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const dataQuery = `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${Customers.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      // Получаем все сервисы для всех компаний одним запросом (решение N+1 проблемы)
      const customerIds = dataResult.rows.map(c => c.id);
      let servicesMap = {};
      
      if (customerIds.length > 0) {
        const servicesQuery = `
          SELECT s.id, s.name, s.comment, s.type, s.is_active as "isActive", 
                 s.created_at as "createdAt", s.updated_at as "updatedAt",
                 cs.customer_id
          FROM services s
          INNER JOIN customers_services cs ON s.id = cs.service_id
          WHERE cs.customer_id = ANY($1)
          ORDER BY s.name
        `;
        const servicesResult = await pool.query(servicesQuery, [customerIds]);
        
        // Группируем сервисы по customer_id
        servicesResult.rows.forEach(row => {
          const customerId = row.customer_id;
          delete row.customer_id;
          if (!servicesMap[customerId]) {
            servicesMap[customerId] = [];
          }
          servicesMap[customerId].push(row);
        });
      }

      // Добавляем сервисы к каждой компании
      const customersWithServices = dataResult.rows.map(customer => ({
        ...customer,
        services: servicesMap[customer.id] || []
      }));

      return {
        customers: customersWithServices,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  // Получить сервисы для компании
  static async getServices(customerId) {
    try {
      const result = await pool.query(
        `SELECT s.id, s.name, s.comment, s.type, s.is_active as "isActive", 
                s.created_at as "createdAt", s.updated_at as "updatedAt"
         FROM services s
         INNER JOIN customers_services cs ON s.id = cs.service_id
         WHERE cs.customer_id = $1
         ORDER BY s.name`,
        [customerId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error in getServices:', error);
      throw error;
    }
  }

  // Добавить сервис к компании
  static async addService(customerId, serviceId) {
    try {
      const result = await pool.query(
        `INSERT INTO customers_services (customer_id, service_id) 
         VALUES ($1, $2) 
         ON CONFLICT (customer_id, service_id) DO NOTHING
         RETURNING *`,
        [customerId, serviceId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in addService:', error);
      throw error;
    }
  }

  // Удалить сервис от компании
  static async removeService(customerId, serviceId) {
    try {
      const result = await pool.query(
        `DELETE FROM customers_services 
         WHERE customer_id = $1 AND service_id = $2
         RETURNING *`,
        [customerId, serviceId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in removeService:', error);
      throw error;
    }
  }

  // Установить сервисы для компании (заменить все)
  static async setServices(customerId, serviceIds) {
    try {
      await pool.query('BEGIN');
      
      // Удаляем все существующие связи
      await pool.query('DELETE FROM customers_services WHERE customer_id = $1', [customerId]);
      
      // Добавляем новые связи
      if (serviceIds && serviceIds.length > 0) {
        const values = serviceIds.map((id, index) => `($1, $${index + 2})`).join(', ');
        await pool.query(
          `INSERT INTO customers_services (customer_id, service_id) VALUES ${values}`,
          [customerId, ...serviceIds]
        );
      }
      
      await pool.query('COMMIT');
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error in setServices:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const result = await pool.query(
        `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${Customers.tableName} WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(customer) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => customer[field]);
      
      // Добавляем isActive
      values.push(customer.isActive !== undefined ? customer.isActive : true);
      
      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      
      const query = `INSERT INTO ${Customers.tableName} (${sqlFieldsInsert}, is_active) VALUES (${placeholders}, $${fieldList.length + 1}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, customer) {
    try {
      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (customer[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(customer[field]);
          paramIndex++;
        }
      });

      // Добавляем isActive если передан
      if (customer.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(customer.isActive);
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Добавляем id в конец
      values.push(id);

      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const query = `UPDATE ${Customers.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${Customers.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = Customers;
