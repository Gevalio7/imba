import { $api } from '@/utils/api'
import { ref, computed } from 'vue'

export function useAuthorSearch(customerUsers: Ref<any[]>, systemConfigs: Ref<any[]>, ticketCompanyId: Ref<number | undefined>) {
  const authorSearch = ref('')

  // Флаг - показывать ли опцию создания нового сотрудника
  const showCreateNewAuthor = ref(false)

  // Временные данные для нового сотрудника
  const newAuthorData = ref({
    email: '',
    firstName: 'Новый',
    lastName: 'Сотрудник',
  })

  // Проверка - разрешено ли создание сотрудника по email
  const canCreateCustomerUserByEmail = computed(() => {
    const config = systemConfigs.value.find(c => c.name === 'create_customer_user_by_email')
    const result = config?.value === 'true' && config?.isActive
    return result
  })

  // Фильтрованный список авторов по поиску
  const filteredAuthorOptions = computed(() => {
    if (!authorSearch.value.trim()) {
      return customerUsers.value.map((c: any) => {
        const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.login || 'Неизвестно'
        const email = c.email ? ` (${c.email})` : ''
        const companyInfo = c.customerName ? ` [${c.customerName}]` : ''
        return {
          title: `${name}${email}${companyInfo}`,
          value: c.id,
          customerId: c.customerId,
          customerName: c.customerName,
        }
      })
    }
    const search = authorSearch.value.toLowerCase()
    return customerUsers.value.filter((a: any) => {
      const name = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login || 'Неизвестно'
      const email = a.email ? ` (${a.email})` : ''
      const companyInfo = a.customerName ? ` [${a.customerName}]` : ''
      const fullTitle = `${name}${email}${companyInfo}`.toLowerCase()
      return fullTitle.includes(search)
    }).map((a: any) => {
      const name = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.login || 'Неизвестно'
      const email = a.email ? ` (${a.email})` : ''
      const companyInfo = a.customerName ? ` [${a.customerName}]` : ''
      return {
        title: `${name}${email}${companyInfo}`,
        value: a.id,
        customerId: a.customerId,
        customerName: a.customerName,
      }
    })
  })

  // Проверка - является ли введенный текст email
  const isEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(text)
  }

  // Обработка ввода в поле автора
  const handleAuthorUpdate = (search: string) => {
    authorSearch.value = search || ''

    // Если включена опция создания по email и введен email
    if (canCreateCustomerUserByEmail.value && search && isEmail(search)) {
      // Проверяем, есть ли сотрудник с таким email
      const found = filteredAuthorOptions.value.find((a: any) =>
        a.title.toLowerCase().includes(search.toLowerCase())
      )

      if (!found) {
        // Показываем опцию создания нового сотрудника
        showCreateNewAuthor.value = true
        newAuthorData.value.email = search
      } else {
        showCreateNewAuthor.value = false
      }
    } else {
      showCreateNewAuthor.value = false
    }
  }

  // Очистка выбора автора
  const handleAuthorClear = () => {
    showCreateNewAuthor.value = false
    newAuthorData.value.email = ''
  }

  // Создание нового сотрудника
  const createNewAuthor = async () => {
    if (!newAuthorData.value.email || !isEmail(newAuthorData.value.email)) {
      return
    }

    try {
      // Создаем сотрудника
      const newUser = await $api('/customerUsers', {
        method: 'POST',
        body: {
          email: newAuthorData.value.email,
          firstName: newAuthorData.value.firstName,
          lastName: newAuthorData.value.lastName,
          login: newAuthorData.value.email,
          customerId: ticketCompanyId.value || null,
        },
      })

      showCreateNewAuthor.value = false
      authorSearch.value = ''

      return newUser
    } catch (err: any) {
      console.error('Error creating customer user:', err)
      throw err
    }
  }

  return {
    authorSearch,
    showCreateNewAuthor,
    newAuthorData,
    filteredAuthorOptions,
    canCreateCustomerUserByEmail,
    handleAuthorUpdate,
    handleAuthorClear,
    createNewAuthor,
  }
}