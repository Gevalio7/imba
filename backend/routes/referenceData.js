const express = require('express')

const router = express.Router()

const Priorities = require('../models/priorities')
const Queues = require('../models/queues')
const States = require('../models/states')
const Types = require('../models/types')
const TypeCategories = require('../models/typeCategories')
const Agents = require('../models/agents')
const AgentsGroups = require('../models/agentsGroups')
const Customers = require('../models/customers')
const CustomersGroups = require('../models/customersGroups')
const Services = require('../models/services')
const Sla = require('../models/sla')
const SystemConfiguration = require('../models/systemConfiguration')
const CustomerUsers = require('../models/customerUsers')
const Workflows = require('../models/workflows')
const PostMasterMailAccounts = require('../models/postMasterMailAccounts')
const Templates = require('../models/templates')
const { asyncHandler } = require('../middleware/errorHandler')

let cachedData = null
let cacheTimestamp = null

// Helper to clear cache programmatically
const clearCache = () => {
  cachedData = null
  cacheTimestamp = null
  console.log('🧹 Reference data cache cleared programmatically')
}

router.clearCache = clearCache

router.get('/', asyncHandler(async (req, res) => {
  const { forceRefresh } = req.query

  // Read TTL from system configuration (seconds). Default 300s (5min)
  let ttlSeconds = 300
  try {
    const cfg = await SystemConfiguration.getAll({ isActive: true })
    const all = cfg.systemConfiguration || []
    const found = all.find(c => c.key === 'reference_data_cache_ttl_seconds' || c.name === 'reference_data_cache_ttl_seconds')
    if (found && parseInt(found.value, 10) >= 0) ttlSeconds = parseInt(found.value, 10)
  } catch (cfgErr) {
    // fallback to default
  }

  const isCacheValid = () => {
    if (!cachedData || !cacheTimestamp) return false
    if (ttlSeconds === 0) return false
    return Date.now() - cacheTimestamp < ttlSeconds * 1000
  }

  if (!forceRefresh && isCacheValid())
    return res.json(cachedData)

  console.log('📊 Loading reference data (batch)...')

  const startTime = Date.now()

  const [
    prioritiesResult,
    queuesResult,
    statesResult,
    typesResult,
    typeCategoriesResult,
    agentsResult,
    agentsGroupsResult,
    customersResult,
    customersGroupsResult,
    servicesResult,
    slaResult,
    systemConfigurationResult,
    customerUsersResult,
    workflowsResult,
    postMasterMailAccountsResult,
    templatesResult,
  ] = await Promise.all([
    Priorities.getAll({ itemsPerPage: 1000, isActive: true }),
    Queues.getAll({ itemsPerPage: 1000, isActive: true }),
    States.getAll({ itemsPerPage: 1000, isActive: true }),
    Types.getAll({ itemsPerPage: 1000, isActive: true }),
    TypeCategories.getAll({ itemsPerPage: 1000, isActive: true }),
    Agents.getAll({ itemsPerPage: 1000, isActive: true }),
    AgentsGroups.getAll({ itemsPerPage: 1000, isActive: true }),
    Customers.getAll({ itemsPerPage: 1000, isActive: true }),
    CustomersGroups.getAll({ itemsPerPage: 1000, isActive: true }),
    Services.getAll({ itemsPerPage: 1000 }),
    Sla.getAll({ itemsPerPage: 1000 }),
    SystemConfiguration.getAll({ itemsPerPage: 1000, isActive: true }),
    CustomerUsers.getAll({ itemsPerPage: 1000 }),
    Workflows.getAll({ itemsPerPage: 1000 }),
    PostMasterMailAccounts.getAll({ itemsPerPage: 1000, isActive: true }),
    Templates.getAll({ itemsPerPage: 1000 }),
  ])

  const data = {
    priorities: prioritiesResult.priorities || [],
    queues: queuesResult.queues || [],
    states: statesResult.states || [],
    types: typesResult.types || [],
    typeCategories: typeCategoriesResult.typeCategories || [],
    agents: agentsResult.agents || [],
    agentGroups: agentsGroupsResult.agentsGroups || [],
    customers: customersResult.customers || [],
    customersGroups: customersGroupsResult.customersGroups || [],
    services: servicesResult.services || [],
    sla: slaResult.sla || [],
    systemConfiguration: systemConfigurationResult.systemConfiguration || [],
    customerUsers: customerUsersResult.customerUsers || [],
    workflows: workflowsResult.workflows || [],
    postMasterMailAccounts: postMasterMailAccountsResult.postMasterMailAccounts || [],
    templates: templatesResult.templates || [],
  }

  console.log('systemConfiguration in data:', data.systemConfiguration)

  cachedData = data
  cacheTimestamp = Date.now()

  const elapsed = Date.now() - startTime

  console.log(`✅ Reference data loaded in ${elapsed}ms`)

  res.json(data)
}))

router.get('/clear-cache', asyncHandler(async (req, res) => {
  cachedData = null
  cacheTimestamp = null
  res.json({ message: 'Cache cleared' })
}))

module.exports = router
