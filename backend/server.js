const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./init-db');
const testEntitiesRouter = require('./routes/testEntities');
const prioritiesRouter = require('./routes/priorities');
const aclRouter = require('./routes/acl');
const adminNotificationRouter = require('./routes/adminNotification');
const agentsRouter = require('./routes/agents');
const agentsGroupsRouter = require('./routes/agentsGroups');
const agentsRolesRouter = require('./routes/agentsRoles');
const appointmentNotificationsRouter = require('./routes/appointmentNotifications');
const attachmentsRouter = require('./routes/attachments');
const calendarsRouter = require('./routes/calendars');
const communicationLogRouter = require('./routes/communicationLog');
const communicationNotificationsSettingsRouter = require('./routes/communicationNotificationsSettings');
const customersRouter = require('./routes/customers');
const customersGroupsRouter = require('./routes/customersGroups');
const customerUsersRouter = require('./routes/customerUsers');
const customerUsersCustomersRouter = require('./routes/customerUsersCustomers');
const customerUsersGroupsRouter = require('./routes/customerUsersGroups');
const customerUsersServicesRouter = require('./routes/customerUsersServices');
const dynamicFieldsRouter = require('./routes/dynamicFields');
const dynamicFieldsScreensRouter = require('./routes/dynamicFieldsScreens');
const emailAddressesRouter = require('./routes/emailAddresses');
const generalCatalogRouter = require('./routes/generalCatalog');
const genericAgentRouter = require('./routes/genericAgent');
const greetingsRouter = require('./routes/greetings');
const groupsRouter = require('./routes/groups');
const oAuth2Router = require('./routes/oAuth2');
const packageManagerRouter = require('./routes/packageManager');
const performanceLogRouter = require('./routes/performanceLog');
const pgpKeysRouter = require('./routes/pgpKeys');
const postMasterFiltersRouter = require('./routes/postMasterFilters');
const postMasterMailAccountsRouter = require('./routes/postMasterMailAccounts');
const processesAutomationSettingsRouter = require('./routes/processesAutomationSettings');
const processManagementRouter = require('./routes/processManagement');
const queueAutoResponseRouter = require('./routes/queueAutoResponse');
const queuesRouter = require('./routes/queues');
const rolesRouter = require('./routes/roles');
const rolesGroupsRouter = require('./routes/rolesGroups');
const servicesRouter = require('./routes/services');
const sessionManagementRouter = require('./routes/sessionManagement');
const signaturesRouter = require('./routes/signatures');
const sLARouter = require('./routes/sLA');
const smimeCertificatesRouter = require('./routes/smimeCertificates');
const sqlBoxRouter = require('./routes/sqlBox');
const statesRouter = require('./routes/states');
const typesRouter = require('./routes/types');
const systemConfigurationRouter = require('./routes/systemConfiguration');
const systemFileSupportRouter = require('./routes/systemFileSupport');
const systemLogRouter = require('./routes/systemLog');
const systemMaintenanceRouter = require('./routes/systemMaintenance');
const templateAttachmentsRouter = require('./routes/templateAttachments');
const templateQueuesRouter = require('./routes/templateQueues');
const templatesRouter = require('./routes/templates');
const ticketAttributeRelationsRouter = require('./routes/ticketAttributeRelations');
const ticketNotificationsRouter = require('./routes/ticketNotifications');
const translationRouter = require('./routes/translation');
const usersGroupsRolesSettingsRouter = require('./routes/usersGroupsRolesSettings');
const webServicesRouter = require('./routes/webServices');
const authRouter = require('./routes/auth');

// Add global error handlers for debugging
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception in backend:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in backend at:', promise, 'reason:', reason);
});

console.log('Backend server.js starting...');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/apps/test-entities', testEntitiesRouter);
app.use('/priorities', prioritiesRouter);
app.use('/acl', aclRouter);
app.use('/adminNotification', adminNotificationRouter);
app.use('/agents', agentsRouter);
app.use('/agentsGroups', agentsGroupsRouter);
app.use('/agentsRoles', agentsRolesRouter);
app.use('/appointmentNotifications', appointmentNotificationsRouter);
app.use('/attachments', attachmentsRouter);
app.use('/calendars', calendarsRouter);
app.use('/communicationLog', communicationLogRouter);
app.use('/communicationNotificationsSettings', communicationNotificationsSettingsRouter);
app.use('/customers', customersRouter);
app.use('/customersGroups', customersGroupsRouter);
app.use('/customerUsers', customerUsersRouter);
app.use('/customerUsersCustomers', customerUsersCustomersRouter);
app.use('/customerUsersGroups', customerUsersGroupsRouter);
app.use('/customerUsersServices', customerUsersServicesRouter);
app.use('/dynamicFields', dynamicFieldsRouter);
app.use('/dynamicFieldsScreens', dynamicFieldsScreensRouter);
app.use('/emailAddresses', emailAddressesRouter);
app.use('/generalCatalog', generalCatalogRouter);
app.use('/genericAgent', genericAgentRouter);
app.use('/greetings', greetingsRouter);
app.use('/groups', groupsRouter);
app.use('/oauth2', oAuth2Router);
app.use('/packageManager', packageManagerRouter);
app.use('/performanceLog', performanceLogRouter);
app.use('/pgpKeys', pgpKeysRouter);
app.use('/postMasterFilters', postMasterFiltersRouter);
app.use('/postMasterMailAccounts', postMasterMailAccountsRouter);
app.use('/processesAutomationSettings', processesAutomationSettingsRouter);
app.use('/processManagement', processManagementRouter);
app.use('/queueAutoResponse', queueAutoResponseRouter);
app.use('/queues', queuesRouter);
app.use('/roles', rolesRouter);
app.use('/rolesGroups', rolesGroupsRouter);
app.use('/services', servicesRouter);
app.use('/sessionManagement', sessionManagementRouter);
app.use('/signatures', signaturesRouter);
app.use('/sla', sLARouter);
app.use('/smimeCertificates', smimeCertificatesRouter);
app.use('/sqlBox', sqlBoxRouter);
app.use('/states', statesRouter);
app.use('/types', typesRouter);
app.use('/systemConfiguration', systemConfigurationRouter);
app.use('/systemFileSupport', systemFileSupportRouter);
app.use('/systemLog', systemLogRouter);
app.use('/systemMaintenance', systemMaintenanceRouter);
app.use('/templateAttachments', templateAttachmentsRouter);
app.use('/templateQueues', templateQueuesRouter);
app.use('/templates', templatesRouter);
app.use('/ticketAttributeRelations', ticketAttributeRelationsRouter);
app.use('/ticketNotifications', ticketNotificationsRouter);
app.use('/translation', translationRouter);
app.use('/usersGroupsRolesSettings', usersGroupsRolesSettingsRouter);
app.use('/webServices', webServicesRouter);
app.use('/auth', authRouter);

(async () => {
  try {
    console.log('Starting database initialization...');
    await initializeDatabase();
    console.log('Database initialized successfully.');

    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
})();
