import { $fetch } from 'ofetch'
import { ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// Справочники
export const priorities = ref<any[]>([])
export const queues = ref<any[]>([])
export const states = ref<any[]>([])
export const types = ref<any[]>([])
export const categories = ref<any[]>([])
export const agents = ref<any[]>([])
export const agentGroups = ref<any[]>([])
export const customers = ref<any[]>([])
export const services = ref<any[]>([])
export const slaList = ref<any[]>([])
export const customerUsers = ref<any[]>([])

// Загрузка справочников
export const fetchPriorities = async () => {
  try {
    const data = await $fetch(`${API_BASE}/priorities`)
    priorities.value = (data as any).priorities || []
  }
  catch (err) {
    console.error('Error fetching priorities:', err)
  }
}

export const fetchQueues = async () => {
  try {
    const data = await $fetch(`${API_BASE}/queues`)
    queues.value = (data as any).queues || []
  }
  catch (err) {
    console.error('Error fetching queues:', err)
  }
}

export const fetchStates = async () => {
  try {
    const data = await $fetch(`${API_BASE}/states`)
    states.value = (data as any).states || []
  }
  catch (err) {
    console.error('Error fetching states:', err)
  }
}

export const fetchTypes = async () => {
  try {
    const data = await $fetch(`${API_BASE}/types`)
    types.value = (data as any).types || []
  }
  catch (err) {
    console.error('Error fetching types:', err)
  }
}

export const fetchCategories = async () => {
  try {
    const data = await $fetch(`${API_BASE}/typeCategories`)
    categories.value = (data as any).categories || []
  }
  catch (err) {
    console.error('Error fetching categories:', err)
  }
}

export const fetchAgents = async () => {
  try {
    const data = await $fetch(`${API_BASE}/agents`)
    agents.value = (data as any).agents || []
  }
  catch (err) {
    console.error('Error fetching agents:', err)
  }
}

export const fetchAgentGroups = async () => {
  try {
    const data = await $fetch(`${API_BASE}/agentsGroups`)
    agentGroups.value = (data as any).agentsGroups || []
  }
  catch (err) {
    console.error('Error fetching agent groups:', err)
  }
}

export const fetchCustomers = async () => {
  try {
    const data = await $fetch(`${API_BASE}/customers`)
    customers.value = (data as any).customers || []
  }
  catch (err) {
    console.error('Error fetching customers:', err)
  }
}

export const fetchServices = async () => {
  try {
    const data = await $fetch(`${API_BASE}/services`)
    services.value = (data as any).services || []
  }
  catch (err) {
    console.error('Error fetching services:', err)
  }
}

export const fetchSla = async () => {
  try {
    const data = await $fetch(`${API_BASE}/sla`)
    slaList.value = (data as any).sla || []
  }
  catch (err) {
    console.error('Error fetching SLA:', err)
  }
}

export const fetchCustomerUsers = async () => {
  try {
    const data = await $fetch(`${API_BASE}/customerUsers`)
    customerUsers.value = (data as any).customerUsers || []
  }
  catch (err) {
    console.error('Error fetching customer users:', err)
  }
}