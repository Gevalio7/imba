const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class Workflows {
  static tableName = 'workflows';
  static fields = 'name, description';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      // Поиск по названию
      if (q) {
        whereClause = `WHERE w.name ILIKE $${paramIndex}`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      let orderClause = 'ORDER BY w.id ASC';
      const sortableFields = ['id', 'name', 'createdAt'];
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY w.${toSnakeCase(sortBy)} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${Workflows.tableName} w ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with transitions count
      const dataQuery = `
        SELECT 
          w.id, 
          w.name,
          w.description,
          w.is_active as "isActive",
          w.created_at as "createdAt",
          w.updated_at as "updatedAt",
          COUNT(wt.id) as "transitionsCount"
        FROM ${Workflows.tableName} w
        LEFT JOIN workflow_transitions wt ON w.id = wt.workflow_id
        ${whereClause}
        GROUP BY w.id
        ${orderClause}
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      `;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        workflows: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(
        `SELECT 
          w.id, 
          w.name,
          w.description,
          w.is_active as "isActive",
          w.created_at as "createdAt",
          w.updated_at as "updatedAt"
        FROM ${Workflows.tableName} w
        WHERE w.id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async getWithTransitions(id) {
    try {
      // Получаем воркфлоу
      const workflow = await this.getById(id);
      if (!workflow) return null;

      // Получаем переходы
      const transitionsResult = await pool.query(
        `SELECT 
          wt.id,
          wt.workflow_id as "workflowId",
          wt.source_status_id as "sourceStatusId",
          wt.target_status_id as "targetStatusId",
          wt.action_label as "actionLabel",
          wt.sort_order as "sortOrder",
          wt.is_active as "isActive",
          ss.name as "sourceStatusName",
          ss.color as "sourceStatusColor",
          ts.name as "targetStatusName",
          ts.color as "targetStatusColor"
        FROM workflow_transitions wt
        LEFT JOIN states ss ON wt.source_status_id = ss.id
        LEFT JOIN states ts ON wt.target_status_id = ts.id
        WHERE wt.workflow_id = $1
        ORDER BY wt.sort_order ASC, wt.id ASC`,
        [id]
      );

      return {
        ...workflow,
        transitions: transitionsResult.rows,
      };
    } catch (error) {
      console.error('Error in getWithTransitions:', error);
      throw error;
    }
  }

  static async create(workflow) {
    try {
      const query = `
        INSERT INTO ${Workflows.tableName} (name, description, is_active) 
        VALUES ($1, $2, $3) 
        RETURNING 
          id, 
          name,
          description,
          is_active as "isActive",
          created_at as "createdAt"
      `;
      const result = await pool.query(query, [
        workflow.name,
        workflow.description || null,
        workflow.isActive !== undefined ? workflow.isActive : true,
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, workflow) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (workflow.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(workflow.name);
        paramIndex++;
      }

      if (workflow.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(workflow.description);
        paramIndex++;
      }

      if (workflow.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(workflow.isActive);
        paramIndex++;
      }

      if (updates.length === 0) {
        return this.getById(id);
      }

      values.push(id);

      const query = `
        UPDATE ${Workflows.tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING 
          id, 
          name,
          description,
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${Workflows.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Получить начальный статус для воркфлоу
  static async getInitialStatus(workflowId) {
    try {
      // Ищем переход без source_status_id (это начальный переход)
      const result = await pool.query(
        `SELECT 
          wt.target_status_id as "targetStatusId",
          s.name as "statusName",
          s.color as "statusColor"
        FROM workflow_transitions wt
        LEFT JOIN states s ON wt.target_status_id = s.id
        WHERE wt.workflow_id = $1 
          AND wt.source_status_id IS NULL
          AND wt.is_active = true
        LIMIT 1`,
        [workflowId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getInitialStatus:', error);
      throw error;
    }
  }
}

module.exports = Workflows;
