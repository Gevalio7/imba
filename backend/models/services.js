const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class Services {
  static tableName = 'services';
  static fields = 'name, comment, type';

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

      let orderClause = 'ORDER BY id ASC'; // Сортировка по умолчанию
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at', 'id']);
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${sortBy} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${Services.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const dataQuery = `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${Services.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      // Получаем все компании для всех сервисов одним запросом (решение N+1 проблемы)
      const serviceIds = dataResult.rows.map(s => s.id);
      let customersMap = {};
      let slaMap = {};
      
      if (serviceIds.length > 0) {
        // Загружаем компании
        const customersQuery = `
          SELECT c.id, c.name, c.street, c.zip, c.city, c.comment, c.is_active as "isActive",
                 c.created_at as "createdAt", c.updated_at as "updatedAt",
                 cs.service_id
          FROM customers c
          INNER JOIN customers_services cs ON c.id = cs.customer_id
          WHERE cs.service_id = ANY($1)
          ORDER BY c.name
        `;
        const customersResult = await pool.query(customersQuery, [serviceIds]);
        
        // Группируем компании по service_id
        customersResult.rows.forEach(row => {
          const serviceId = row.service_id;
          delete row.service_id;
          if (!customersMap[serviceId]) {
            customersMap[serviceId] = [];
          }
          customersMap[serviceId].push(row);
        });

        // Загружаем SLA для каждого сервиса через колонку sla_id
        const slaQuery = `
          SELECT s.id, s.name, s.description, s.is_active as "isActive",
                 s.created_at as "createdAt", s.updated_at as "updatedAt",
                 sv.id as service_id
          FROM sla s
          INNER JOIN services sv ON s.id = sv.sla_id
          WHERE sv.id = ANY($1)
        `;
        const slaResult = await pool.query(slaQuery, [serviceIds]);
        
        // Группируем SLA по service_id
        slaResult.rows.forEach(row => {
          const serviceId = row.service_id;
          delete row.service_id;
          slaMap[serviceId] = row;
        });
      }

      // Добавляем компании и SLA к каждому сервису
      const servicesWithCustomers = dataResult.rows.map(service => ({
        ...service,
        customers: customersMap[service.id] || [],
        sla: slaMap[service.id] || null
      }));

      return {
        services: servicesWithCustomers,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  // Получить компании для сервиса
  static async getCustomers(serviceId) {
    try {
      const result = await pool.query(
        `SELECT c.id, c.name, c.street, c.zip, c.city, c.comment, c.is_active as "isActive",
                c.created_at as "createdAt", c.updated_at as "updatedAt"
         FROM customers c
         INNER JOIN customers_services cs ON c.id = cs.customer_id
         WHERE cs.service_id = $1
         ORDER BY c.name`,
        [serviceId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error in getCustomers:', error);
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
        `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${Services.tableName} WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(service) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => service[field]);
      
      // Добавляем isActive
      values.push(service.isActive !== undefined ? service.isActive : true);
      
      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      
      const query = `INSERT INTO ${Services.tableName} (${sqlFieldsInsert}, is_active) VALUES (${placeholders}, $${fieldList.length + 1}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, service) {
    try {
      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (service[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(service[field]);
          paramIndex++;
        }
      });

      // Добавляем isActive если передан
      if (service.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(service.isActive);
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

      const query = `UPDATE ${Services.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${Services.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Установить компании для сервиса
  static async setCustomers(serviceId, customerIds) {
    try {
      await pool.query('BEGIN');

      // Сначала удаляем все существующие связи
      await pool.query('DELETE FROM customers_services WHERE service_id = $1', [serviceId]);

      // Если есть новые компании, добавляем связи
      if (customerIds && customerIds.length > 0) {
        const values = customerIds.map((customerId, index) => `($1, $${index + 2})`).join(', ');
        const query = `INSERT INTO customers_services (service_id, customer_id) VALUES ${values}`;
        await pool.query(query, [serviceId, ...customerIds]);
      }

      await pool.query('COMMIT');
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error in setCustomers:', error);
      throw error;
    }
  }

  // Получить ID компаний для сервиса
  static async getCustomerIds(serviceId) {
    try {
      const result = await pool.query(
        'SELECT customer_id FROM customers_services WHERE service_id = $1',
        [serviceId]
      );
      return result.rows.map(row => row.customer_id);
    } catch (error) {
      console.error('Error in getCustomerIds:', error);
      throw error;
    }
  }

  // Добавить компанию к сервису
  static async addCustomer(serviceId, customerId) {
    try {
      const result = await pool.query(
        `INSERT INTO customers_services (service_id, customer_id) 
         VALUES ($1, $2) 
         ON CONFLICT (service_id, customer_id) DO NOTHING
         RETURNING *`,
        [serviceId, customerId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in addCustomer:', error);
      throw error;
    }
  }

  // Удалить компанию от сервиса
  static async removeCustomer(serviceId, customerId) {
    try {
      const result = await pool.query(
        `DELETE FROM customers_services 
         WHERE service_id = $1 AND customer_id = $2
         RETURNING *`,
        [serviceId, customerId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in removeCustomer:', error);
      throw error;
    }
  }

  // ========== МЕТОДЫ ДЛЯ РАБОТЫ С SLA (связь через колонку sla_id) ==========

  // Получить SLA для сервиса
  static async getSLA(serviceId) {
    try {
      const result = await pool.query(
        `SELECT s.id, s.name, s.description, s.is_active as "isActive",
                s.created_at as "createdAt", s.updated_at as "updatedAt"
         FROM sla s
         INNER JOIN services sv ON s.id = sv.sla_id
         WHERE sv.id = $1`,
        [serviceId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getSLA:', error);
      throw error;
    }
  }

  // Установить SLA для сервиса
  static async setSLA(serviceId, slaId) {
    try {
      await pool.query(
        'UPDATE services SET sla_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [slaId || null, serviceId]
      );
      return true;
    } catch (error) {
      console.error('Error in setSLA:', error);
      throw error;
    }
  }
}

module.exports = Services;
