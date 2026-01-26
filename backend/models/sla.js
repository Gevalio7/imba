const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class Sla {
  static tableName = 'sla';
  static fields = 'name, description, responseTime, resolutionTime';

  static async getAll(options = {}) {
    console.log('getAll called with options:', options);
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      // if (q) {
      //   const searchFields = this.fields.split(', ');
      //   const conditions = searchFields.map(field => `s.${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
      //   whereClause = `WHERE ${conditions}`;
      //   params.push(`%${q}%`);
      //   paramIndex++;
      // }

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at']);
      if (sortBy && sortableFields.includes(sortBy)) {
        const orderField = ['created_at', 'updated_at'].includes(sortBy) ? sortBy : `s.${sortBy}`;
        orderClause = `ORDER BY ${orderField} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${Sla.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with calendar and services
      // Сначала получаем SLA
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const dataQuery = `
        SELECT
          s.id, s.name, s.description, s.response_time as "responseTime", s.resolution_time as "resolutionTime",
          s.calendar_id as "calendarId",
          s.created_at as "createdAt",
          s.updated_at as "updatedAt",
          s.is_active as "isActive",
          c.name as "calendarName"
        FROM ${Sla.tableName} s
        LEFT JOIN calendars c ON s.calendar_id = c.id
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      // Для каждого SLA получаем services
      for (const sla of dataResult.rows) {
        const servicesQuery = `
          SELECT ss.service_id as id, svc.name
          FROM sla_services ss
          JOIN services svc ON ss.service_id = svc.id
          WHERE ss.sla_id = $1
        `;
        const servicesResult = await pool.query(servicesQuery, [sla.id]);
        sla.serviceIds = servicesResult.rows.map(s => s.id);
        sla.serviceNames = servicesResult.rows.map(s => s.name);
      }

      return {
        sla: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
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
        `SELECT
          s.id, s.name, s.description, s.response_time as "responseTime", s.resolution_time as "resolutionTime",
          s.calendar_id as "calendarId",
          s.created_at as "createdAt",
          s.updated_at as "updatedAt",
          s.is_active as "isActive",
          c.name as "calendarName"
        FROM ${Sla.tableName} s
        LEFT JOIN calendars c ON s.calendar_id = c.id
        WHERE s.id = $1`,
        [id]
      );

      if (result.rows.length === 0) return null;

      const sla = result.rows[0];

      // Получаем services
      const servicesQuery = `
        SELECT ss.service_id as id, svc.name
        FROM sla_services ss
        JOIN services svc ON ss.service_id = svc.id
        WHERE ss.sla_id = $1
      `;
      const servicesResult = await pool.query(servicesQuery, [id]);
      sla.serviceIds = servicesResult.rows.map(s => s.id);
      sla.serviceNames = servicesResult.rows.map(s => s.name);

      return sla;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(sla) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => sla[field]);

      // Добавляем calendarId
      values.push(sla.calendarId || null);

      // Добавляем isActive
      values.push(sla.isActive !== undefined ? sla.isActive : true);

      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const query = `INSERT INTO ${Sla.tableName} (${sqlFieldsInsert}, calendar_id, is_active) VALUES (${placeholders}, $${fieldList.length + 1}, $${fieldList.length + 2}) RETURNING id, ${sqlFieldsSelect}, calendar_id as "calendarId", created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;

      const result = await client.query(query, values);
      const newSla = result.rows[0];

      // Добавляем services если переданы
      if (sla.services && Array.isArray(sla.services) && sla.services.length > 0) {
        const serviceValues = sla.services.map(serviceId => `(${newSla.id}, ${serviceId})`).join(', ');
        await client.query(`INSERT INTO sla_services (sla_id, service_id) VALUES ${serviceValues}`);
      }

      await client.query('COMMIT');
      return newSla;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in create:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id, sla) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (sla[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(sla[field]);
          paramIndex++;
        }
      });

      // Добавляем calendarId если передан
      if (sla.calendarId !== undefined) {
        updates.push(`calendar_id = $${paramIndex}`);
        values.push(sla.calendarId);
        paramIndex++;
      }

      // Добавляем isActive если передан
      if (sla.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(sla.isActive);
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

      const query = `UPDATE ${Sla.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, calendar_id as "calendarId", created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await client.query(query, values);
      const updatedSla = result.rows[0];

      if (updatedSla) {
        // Обновляем services если переданы
        if (sla.services !== undefined) {
          // Удаляем старые связи
          await client.query('DELETE FROM sla_services WHERE sla_id = $1', [id]);

          // Добавляем новые связи
          if (Array.isArray(sla.services) && sla.services.length > 0) {
            const serviceValues = sla.services.map(serviceId => `(${id}, ${serviceId})`).join(', ');
            await client.query(`INSERT INTO sla_services (sla_id, service_id) VALUES ${serviceValues}`);
          }
        }
      }

      await client.query('COMMIT');
      return updatedSla || null;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in update:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${Sla.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = Sla;
