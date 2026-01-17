const fs = require('fs');
const path = require('path');

const entities = [
  'Acl', 'AdminNotification', 'Agents', 'AgentsGroups', 'AgentsRoles', 'AppointmentNotifications',
  'Attachments', 'Calendars', 'CommunicationLog', 'CommunicationNotificationsSettings',
  'Customers', 'CustomersGroups', 'CustomerUsers', 'CustomerUsersCustomers', 'CustomerUsersGroups',
  'CustomerUsersServices', 'DynamicFields', 'DynamicFieldsScreens', 'EmailAddresses',
  'GeneralCatalog', 'GenericAgent', 'Greetings', 'Groups', 'OAuth2', 'PackageManager',
  'PerformanceLog', 'PgpKeys', 'PostMasterFilters', 'PostMasterMailAccounts', 'Priorities',
  'ProcessesAutomationSettings', 'ProcessManagement', 'QueueAutoResponse', 'Queues', 'Roles',
  'RolesGroups', 'Services', 'SessionManagement', 'Signatures', 'SLA', 'SmimeCertificates',
  'SqlBox', 'States', 'SystemConfiguration', 'SystemFileSupport', 'SystemLog', 'SystemMaintenance',
  'TemplateAttachments', 'TemplateQueues', 'Templates', 'TicketAttributeRelations',
  'TicketNotifications', 'Translation', 'UsersGroupsRolesSettings', 'WebServices'
];

const singularMap = {
  'Acl': 'Acl',
  'AdminNotification': 'AdminNotification',
  'Agents': 'Agent',
  'AgentsGroups': 'AgentsGroup',
  'AgentsRoles': 'AgentsRole',
  'AppointmentNotifications': 'AppointmentNotification',
  'Attachments': 'Attachment',
  'Calendars': 'Calendar',
  'CommunicationLog': 'CommunicationLog',
  'CommunicationNotificationsSettings': 'CommunicationNotificationsSetting',
  'Customers': 'Customer',
  'CustomersGroups': 'CustomersGroup',
  'CustomerUsers': 'CustomerUser',
  'CustomerUsersCustomers': 'CustomerUsersCustomer',
  'CustomerUsersGroups': 'CustomerUsersGroup',
  'CustomerUsersServices': 'CustomerUsersService',
  'DynamicFields': 'DynamicField',
  'DynamicFieldsScreens': 'DynamicFieldsScreen',
  'EmailAddresses': 'EmailAddress',
  'GeneralCatalog': 'GeneralCatalog',
  'GenericAgent': 'GenericAgent',
  'Greetings': 'Greeting',
  'Groups': 'Group',
  'OAuth2': 'OAuth2',
  'PackageManager': 'PackageManager',
  'PerformanceLog': 'PerformanceLog',
  'PgpKeys': 'PgpKey',
  'PostMasterFilters': 'PostMasterFilter',
  'PostMasterMailAccounts': 'PostMasterMailAccount',
  'Priorities': 'Priority',
  'ProcessesAutomationSettings': 'ProcessesAutomationSetting',
  'ProcessManagement': 'ProcessManagement',
  'QueueAutoResponse': 'QueueAutoResponse',
  'Queues': 'Queue',
  'Roles': 'Role',
  'RolesGroups': 'RolesGroup',
  'Services': 'Service',
  'SessionManagement': 'SessionManagement',
  'Signatures': 'Signature',
  'SLA': 'SLA',
  'SmimeCertificates': 'SmimeCertificate',
  'SqlBox': 'SqlBox',
  'States': 'State',
  'SystemConfiguration': 'SystemConfiguration',
  'SystemFileSupport': 'SystemFileSupport',
  'SystemLog': 'SystemLog',
  'SystemMaintenance': 'SystemMaintenance',
  'TemplateAttachments': 'TemplateAttachment',
  'TemplateQueues': 'TemplateQueue',
  'Templates': 'Template',
  'TicketAttributeRelations': 'TicketAttributeRelation',
  'TicketNotifications': 'TicketNotification',
  'Translation': 'Translation',
  'UsersGroupsRolesSettings': 'UsersGroupsRolesSetting',
  'WebServices': 'WebService'
};

entities.forEach(entity => {
  const singular = singularMap[entity];
  const plural = entity.charAt(0).toLowerCase() + entity.slice(1);
  const controllerName = plural + 'Controller';

  const getPlural = 'get' + entity;
  const getById = 'get' + singular + 'ById';
  const create = 'create' + entity;
  const update = 'update' + entity;
  const del = 'delete' + entity;

  const content = `const express = require('express');
const router = express.Router();
const {
  ${getPlural},
  ${getById},
  ${create},
  ${update},
  ${del},
} = require('../controllers/${controllerName}');

// GET /${plural} - список с query params
router.get('/', ${getPlural});

// GET /${plural}/:id
router.get('/:id', ${getById});

// POST /${plural}
router.post('/', ${create});

// PUT /${plural}/:id
router.put('/:id', ${update});

// DELETE /${plural}/:id
router.delete('/:id', ${del});

module.exports = router;
`;

  const filePath = path.join(__dirname, 'routes', plural + '.js');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Generated ${filePath}`);
});

console.log('All routes generated.');
