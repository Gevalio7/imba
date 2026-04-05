import { $fetch } from 'ofetch'
import { ref } from 'vue'
import * as ticketData from './useTicketData'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// Toast
const toastMessage = ref('')
const toastColor = ref('success')
const isToastVisible = ref(false)

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Создание сотрудника по email
const createCustomerUserFromEmail = async (email: string, customerId: number) => {
  try {
    const data = await $fetch(`${API_BASE}/customerUsers`, {
      method: 'POST',
      body: {
        email,
        customerId,
      },
    })

    // Добавляем нового сотрудника в список
    ticketData.customerUsers.value.push(data)

    return data
  }
  catch (err: any) {
    console.error('Error creating customer user:', err)
    throw err
  }
}

// Создание сотрудника
const createCustomerUser = async (firstName: string, lastName: string, email: string, customerId: number) => {
  try {
    const data = await $fetch(`${API_BASE}/customerUsers`, {
      method: 'POST',
      body: {
        firstName,
        lastName,
        email,
        customerId,
      },
    })

    // Добавляем нового сотрудника в список
    ticketData.customerUsers.value.push(data)

    return data
  }
  catch (err: any) {
    console.error('Error creating customer user:', err)
    throw err
  }
}

export {
  toastMessage,
  toastColor,
  isToastVisible,
  showToast,
  createCustomerUserFromEmail,
  createCustomerUser,
}