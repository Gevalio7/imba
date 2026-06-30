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

// --- Section registry: maps client section name → { model, defaultOpts, resultKey } ---
const SECTION_REGISTRY = {
  priorities: { model: Priorities, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'priorities' },
  queues: { model: Queues, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'queues' },
  states: { model: States, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'states' },
  types: { model: Types, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'types' },
  typeCategories: { model: TypeCategories, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'typeCategories' },
  agents: { model: Agents, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'agents' },
  agentGroups: { model: AgentsGroups, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'agentGroups' },
  customers: { model: Customers, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'customers' },
  customersGroups: { model: CustomersGroups, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'customersGroups' },
  services: { model: Services, defaultOpts: { itemsPerPage: 1000 }, resultKey: 'services' },
  sla: { model: Sla, defaultOpts: { itemsPerPage: 1000 }, resultKey: 'sla' },
  systemConfiguration: { model: SystemConfiguration, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'systemConfiguration' },
  customerUsers: { model: CustomerUsers, defaultOpts: { itemsPerPage: 1000 }, resultKey: 'customerUsers' },
  workflows: { model: Workflows, defaultOpts: { itemsPerPage: 1000 }, resultKey: 'workflows' },
  postMasterMailAccounts: { model: PostMasterMailAccounts, defaultOpts: { itemsPerPage: 1000, isActive: true }, resultKey: 'postMasterMailAccounts' },
  templates: { model: Templates, defaultOpts: { itemsPerPage: 1000 }, resultKey: 'templates' },
}

const ALL_SECTIONS = Object.keys(SECTION_REGISTRY)

let cachedData = null
let cachedSections = new Set()
let cacheTimestamp = null

// Helper to clear cache programmatically
const clearCache = () => {
  cachedData = null
  cachedSections = new Set()
  cacheTimestamp = null
  console.log('🧹 Reference data cache cleared programmatically')
}

router.clearCache = clearCache

/**
 * Fetch one or more sections in parallel.
 * Returns { data: { sectionName: [...] }, newlyCached: Set }
 */
async function fetchSections(sectionsToFetch) {
  const fetchPromises = sectionsToFetch.map(async (name) => {
    const entry = SECTION_REGISTRY[name]
    if (!entry) return { name, result: [] }
    try {
      const result = await entry.model.getAll(entry.defaultOpts)
      return { name, result: (result && result[entry.resultKey]) || [] }
    } catch (err) {
      console.error(`⚠️ Error fetching section "${name}":`, err.message)
      return { name, result: [] }
    }
  })

  const fetched = await Promise.all(fetchPromises)
  const data = {}
  const newlyCached = new Set()
  for (const { name, result } of fetched) {
    data[name] = result
    newlyCached.add(name)
  }
  return { data, newlyCached }
}

router.get('/', asyncHandler(async (req, res) => {
  const { forceRefresh, sections } = req.query

  // Parse requested sections (comma-separated), or default to ALL
  let requestedSections
  if (sections && typeof sections === 'string' && sections.trim()) {
    requestedSections = sections.split(',').map(s => s.trim()).filter(s => s && SECTION_REGISTRY[s])
  }
  if (!requestedSections || requestedSections.length === 0)
    requestedSections = ALL_SECTIONS

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

  // Try cache first (unless forceRefresh)
  const allSectionsCached = requestedSections.every(s => cachedSections.has(s))
  if (!forceRefresh && isCacheValid() && allSectionsCached) {
    // Build response from cache for requested sections only
    const partialResponse = {}
    for (const name of requestedSections) {
      partialResponse[name] = cachedData[name] || []
    }
    return res.json(partialResponse)
  }

  console.log(`📊 Loading reference data (${requestedSections.length}/${ALL_SECTIONS.length} sections): ${requestedSections.join(', ')}`)
  const startTime = Date.now()

  // Fetch only the sections that aren't cached (or all if forceRefresh)
  const sectionsToFetch = forceRefresh
    ? requestedSections
    : requestedSections.filter(s => !cachedSections.has(s) || !isCacheValid())

  if (sectionsToFetch.length === 0) {
    // All requested sections are already cached — just return them
    const partialResponse = {}
    for (const name of requestedSections) {
      partialResponse[name] = cachedData[name] || []
    }
    return res.json(partialResponse)
  }

  const { data: newData, newlyCached } = await fetchSections(sectionsToFetch)

  // Merge into global cache
  if (!cachedData) cachedData = {}
  for (const name of newlyCached) {
    cachedData[name] = newData[name]
    cachedSections.add(name)
  }
  cacheTimestamp = Date.now()

  // Build response: use cached + fresh data for requested sections
  const response = {}
  for (const name of requestedSections) {
    response[name] = cachedData[name] || []
  }

  const elapsed = Date.now() - startTime
  console.log(`✅ Reference data loaded (${sectionsToFetch.length} sections fetched) in ${elapsed}ms`)

  res.json(response)
}))

router.get('/clear-cache', asyncHandler(async (req, res) => {
  cachedData = null
  cachedSections = new Set()
  cacheTimestamp = null
  res.json({ message: 'Cache cleared' })
}))

module.exports = router
