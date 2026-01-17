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
  'SmimeCertificates', 'SqlBox', 'States', 'SystemConfiguration', 'SystemFileSupport',
  'SystemLog', 'SystemMaintenance', 'TemplateAttachments', 'TemplateQueues', 'Templates',
  'TicketAttributeRelations', 'TicketNotifications', 'Translation', 'UsersGroupsRolesSettings',
  'WebServices'
];

function singularize(str) {
  if (str === 'PgpKeys') return 'PgpKey';
  if (str === 'EmailAddresses') return 'EmailAddress';
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
  if (str.endsWith('s')) return str.slice(0, -1);
  return str;
}

function generateController(entity) {
  const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
  const singular = singularize(entity);
  const fileName = modelName + 'Controller.js';

  const code = `const ${entity} = require('../models/${modelName}');

const get${entity} = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await ${entity}.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in get${entity}:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const get${singular}ById = async (req, res) => {
  try {
    const { id } = req.params;
    const ${singular.toLowerCase()}Id = parseInt(id, 10);

    if (isNaN(${singular.toLowerCase()}Id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const ${singular.toLowerCase()} = await ${entity}.getById(${singular.toLowerCase()}Id);

    if (!${singular.toLowerCase()}) {
      return res.status(404).json({ message: '${singular} not found' });
    }

    res.json(${singular.toLowerCase()});
  } catch (error) {
    console.error('Error in get${singular}ById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const create${entity} = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const new${singular} = await ${entity}.create({ name, description, status, isActive });

    res.status(201).json(new${singular});
  } catch (error) {
    console.error('Error in create${entity}:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const update${entity} = async (req, res) => {
  try {
    const { id } = req.params;
    const ${singular.toLowerCase()}Id = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(${singular.toLowerCase()}Id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updated${singular} = await ${entity}.update(${singular.toLowerCase()}Id, { name, description, status, isActive });

    if (!updated${singular}) {
      return res.status(404).json({ message: '${singular} not found' });
    }

    res.json(updated${singular});
  } catch (error) {
    console.error('Error in update${entity}:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const delete${entity} = async (req, res) => {
  try {
    const { id } = req.params;
    const ${singular.toLowerCase()}Id = parseInt(id, 10);

    if (isNaN(${singular.toLowerCase()}Id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await ${entity}.delete(${singular.toLowerCase()}Id);

    if (!deleted) {
      return res.status(404).json({ message: '${singular} not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in delete${entity}:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  get${entity},
  get${singular}ById,
  create${entity},
  update${entity},
  delete${entity},
};
`;

  const filePath = path.join(__dirname, 'controllers', fileName);
  fs.writeFileSync(filePath, code);
  console.log(`Generated ${filePath}`);
}

entities.forEach(entity => {
  generateController(entity);
});

console.log('All controllers generated.');
