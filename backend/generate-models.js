const fs = require('fs');
const path = require('path');

const entities = [
  'Acl', 'AdminNotification', 'Agents', 'AgentsGroups', 'AgentsRoles', 'AppointmentNotifications',
  'Attachments', 'Calendars', 'CommunicationLog', 'CommunicationNotificationsSettings',
  'Customers', 'CustomersGroups', 'CustomerUsers', 'CustomerUsersCustomers', 'CustomerUsersGroups',
  'CustomerUsersServices', 'DynamicFields', 'DynamicFieldsScreens', 'EmailAddresses',
  'GeneralCatalog', 'GenericAgent', 'Greetings', 'Groups', 'OAuth2', 'PackageManager',
  'PerformanceLog', 'PgpKeys', 'PostMasterFilters', 'PostMasterMailAccounts', 'Priorities',
  'ProcessesAutomationSettings', 'ProcessManagement', 'QueueAutoResponse', 'Queues',
  'Roles', 'RolesGroups', 'Services', 'SessionManagement', 'Signatures', 'SLA',
  'SmimeCertificates', 'SqlBox', 'States', 'Types', 'SystemConfiguration', 'SystemFileSupport',
  'SystemLog', 'SystemMaintenance', 'TemplateAttachments', 'TemplateQueues', 'Templates',
  'TicketAttributeRelations', 'TicketNotifications', 'Translation', 'UsersGroupsRolesSettings',
  'WebServices'
];

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

  // Special fields for specific entities
  let fields = 'name, description';
  if (entity === 'Priorities') {
    fields = 'name, color';
  }
  const fieldList = fields.split(', ');

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
        const fieldList = this.fields.split(', ');
        whereClause = \`WHERE \${fieldList[0]} ILIKE \$1 OR \${fieldList[1]} ILIKE \$1\`;
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
      const result = await pool.query(\`INSERT INTO \${${className}.tableName} (\${this.fields}, status, is_active) VALUES (\$1, \$2, \$3, \$4) RETURNING id, \${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"\`, [${singular}[fieldList[0]], ${singular}[fieldList[1]], ${singular}.status, ${singular}.isActive]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, ${singular}) {
    try {
      const fieldList = this.fields.split(', ');
      const result = await pool.query(\`UPDATE \${${className}.tableName} SET \${fieldList[0]} = \$1, \${fieldList[1]} = \$2, status = \$3, is_active = \$4, updated_at = CURRENT_TIMESTAMP WHERE id = \$5 RETURNING id, \${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"\`, [${singular}[fieldList[0]], ${singular}[fieldList[1]], ${singular}.status, ${singular}.isActive, id]);

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
