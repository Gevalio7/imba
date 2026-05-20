import { reactive, ref } from 'vue'
import { $api } from '@/utils/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL

interface ReferenceData {
  priorities: any[]
  queues: any[]
  states: any[]
  types: any[]
  typeCategories: any[]
  agents: any[]
  agentGroups: any[]
  customers: any[]
  services: any[]
  sla: any[]
  systemConfiguration: any[]
  customerUsers: any[]
  workflows: any[]
  postMasterMailAccounts: any[]
  templates: any[]
}

const data = reactive<ReferenceData>({
  priorities: [],
  queues: [],
  states: [],
  types: [],
  typeCategories: [],
  agents: [],
  agentGroups: [],
  customers: [],
  services: [],
  sla: [],
  systemConfiguration: [],
  customerUsers: [],
  workflows: [],
  postMasterMailAccounts: [],
  templates: [],
})

const isLoaded = ref(false)
const isLoading = ref(false)
const lastFetch = ref<number | null>(null)

const CACHE_TTL = 30 * 1000 // 30 seconds

export function useReferenceData() {
  const fetchAll = async (forceRefresh = false) => {
    if (isLoading.value)
      return

    if (!forceRefresh && isLoaded.value && lastFetch.value) {
      if (Date.now() - lastFetch.value < CACHE_TTL)
        return
    }

    isLoading.value = true
    try {
      const endpoint = forceRefresh
        ? '/referenceData?forceRefresh=true'
        : '/referenceData'

      const result = await $api<ReferenceData>(`${API_BASE}/referenceData${forceRefresh ? '?forceRefresh=true' : ''}`)

      data.priorities = result.priorities || []
      data.queues = result.queues || []
      data.states = result.states || []
      data.types = result.types || []
      data.typeCategories = result.typeCategories || []
      data.agents = result.agents || []
      data.agentGroups = result.agentGroups || []
      data.customers = result.customers || []
      data.services = result.services || []
      data.sla = result.sla || []
      data.systemConfiguration = result.systemConfiguration || []
      data.customerUsers = result.customerUsers || []
      data.workflows = result.workflows || []
      data.postMasterMailAccounts = result.postMasterMailAccounts || []
      data.templates = result.templates || []

      isLoaded.value = true
      lastFetch.value = Date.now()
    }
    catch (err) {
      console.error('Error loading reference data:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  const clearCache = () => {
    isLoaded.value = false
    lastFetch.value = null
  }

  const refreshData = async () => {
    return fetchAll(true)
  }

  return {
    data,
    isLoaded,
    isLoading,
    fetchAll,
    clearCache,
    refreshData,
  }
}
