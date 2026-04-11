const express = require('express');
const router = express.Router();

const Priorities = require('../models/priorities');
const Queues = require('../models/queues');
const States = require('../models/states');
const Types = require('../models/types');
const TypeCategories = require('../models/typeCategories');
const Agents = require('../models/agents');
const AgentsGroups = require('../models/agentsGroups');
const Customers = require('../models/customers');
const Services = require('../models/services');
const Sla = require('../models/sla');
const SystemConfiguration = require('../models/systemConfiguration');
const CustomerUsers = require('../models/customerUsers');
const Workflows = require('../models/workflows');
const { asyncHandler } = require('../middleware/errorHandler');

const REFERENCE_DATA_CACHE_TTL = 5 * 60 * 1000;

let cachedData = null;
let cacheTimestamp = null;

const isCacheValid = () => {
  if (!cachedData || !cacheTimestamp) return false;
  return Date.now() - cacheTimestamp < REFERENCE_DATA_CACHE_TTL;
};

router.get('/', asyncHandler(async (req, res) => {
  const { forceRefresh } = req.query;
  
  if (!forceRefresh && isCacheValid()) {
    return res.json(cachedData);
  }

  console.log('📊 Loading reference data (batch)...');
  const startTime = Date.now();

  const [
    prioritiesResult,
    queuesResult,
    statesResult,
    typesResult,
    typeCategoriesResult,
    agentsResult,
    agentsGroupsResult,
    customersResult,
    servicesResult,
    slaResult,
    systemConfigurationResult,
    customerUsersResult,
    workflowsResult,
  ] = await Promise.all([
    Priorities.getAll({ itemsPerPage: 1000 }),
    Queues.getAll({ itemsPerPage: 1000 }),
    States.getAll({ itemsPerPage: 1000 }),
    Types.getAll({ itemsPerPage: 1000 }),
    TypeCategories.getAll({ itemsPerPage: 1000 }),
    Agents.getAll({ itemsPerPage: 1000 }),
    AgentsGroups.getAll({ itemsPerPage: 1000 }),
    Customers.getAll({ itemsPerPage: 1000 }),
    Services.getAll({ itemsPerPage: 1000 }),
    Sla.getAll({ itemsPerPage: 1000 }),
    SystemConfiguration.getAll({ itemsPerPage: 1000 }),
    CustomerUsers.getAll({ itemsPerPage: 1000 }),
    Workflows.getAll({ itemsPerPage: 1000 }),
  ]);

  const data = {
    priorities: prioritiesResult.priorities || [],
    queues: queuesResult.queues || [],
    states: statesResult.states || [],
    types: typesResult.types || [],
    typeCategories: typeCategoriesResult.typeCategories || [],
    agents: agentsResult.agents || [],
    agentGroups: agentsGroupsResult.agentsGroups || [],
    customers: customersResult.customers || [],
    services: servicesResult.services || [],
    sla: slaResult.sla || [],
    systemConfiguration: systemConfigurationResult.systemConfiguration || [],
    customerUsers: customerUsersResult.customerUsers || [],
    workflows: workflowsResult.workflows || [],
  };

  cachedData = data;
  cacheTimestamp = Date.now();

  const elapsed = Date.now() - startTime;
  console.log(`✅ Reference data loaded in ${elapsed}ms`);

  res.json(data);
}));

router.get('/clear-cache', asyncHandler(async (req, res) => {
  cachedData = null;
  cacheTimestamp = null;
  res.json({ message: 'Cache cleared' });
}));

module.exports = router;
