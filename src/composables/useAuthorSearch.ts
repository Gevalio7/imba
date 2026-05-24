import { computed, ref } from 'vue'
import { $api } from '@/utils/api'

export function useAuthorSearch(
  customerUsers: Ref<any[]>, 
  systemConfigs: Ref<any[]>, 
  ticketCompanyId: Ref<number | undefined>,
  currentQueueId?: Ref<number | undefined>   // для отправки писем с почты очереди
) {
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
    const isEnabled = config?.value === true || config?.value === 'true'
    const isActive = config?.isActive !== false

    console.log('Config create_customer_user_by_email:', { value: config?.value, isActive: config?.isActive, canCreate: isEnabled && isActive })

    return isEnabled && isActive
  })

  // Фильтрованный список авторов по поиску
  const filteredAuthorOptions = computed(() => {
    // Если предлагаем создать нового сотрудника, скрываем обычные опции
    if (showCreateNewAuthor.value)
      return []

    if (!authorSearch.value.trim()) {
      return customerUsers.value.map((a: any) => {
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

  // Проверка - является ли введенный текст потенциальным email (содержит @)
  const isPotentialEmail = (text: string) => {
    return text.includes('@') && !text.includes(' ')
  }

  // Проверка - является ли введенный текст email
  const isEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

    return emailRegex.test(text)
  }

  // Обработка ввода в поле автора
  const handleAuthorUpdate = (search: string) => {
    authorSearch.value = search || ''

    console.log(`handleAuthorUpdate: search="${search}", canCreate=${canCreateCustomerUserByEmail.value}, isPotentialEmail=${search ? isPotentialEmail(search) : false}, isEmail=${search ? isEmail(search) : false}, filteredLength=${filteredAuthorOptions.value.length}`)

    // Если включена опция создания по email и введен потенциальный email
    if (canCreateCustomerUserByEmail.value && search && isPotentialEmail(search)) {
      // Проверяем, есть ли сотрудник с таким email
      const found = filteredAuthorOptions.value.find((a: any) =>
        a.title.toLowerCase().includes(search.toLowerCase()),
      )

      console.log(`Email check: found=${!!found}, showCreateNewAuthor will be ${!found}`)

      if (!found) {
        // Показываем опцию создания нового сотрудника
        showCreateNewAuthor.value = true
        newAuthorData.value.email = search
      }
      else {
        showCreateNewAuthor.value = false
      }
    }
    else {
      showCreateNewAuthor.value = false
    }

    console.log(`Final showCreateNewAuthor=${showCreateNewAuthor.value}`)
  }

  // Очистка выбора автора
  const handleAuthorClear = () => {
    showCreateNewAuthor.value = false
    newAuthorData.value.email = ''
  }

  // Создание нового сотрудника "на лету"
  const createNewAuthor = async () => {
    if (!newAuthorData.value.email || !isEmail(newAuthorData.value.email))
      return

    try {
      const newUser = await $api('/customerUsers', {
        method: 'POST',
        body: {
          email: newAuthorData.value.email,
          firstName: newAuthorData.value.firstName,
          lastName: newAuthorData.value.lastName,
          login: newAuthorData.value.email,
          customerId: ticketCompanyId.value || null,
          // Передаём контекст очереди — на бэкенде сгенерируют пароль и отправят письмо
          // с почтового ящика этой очереди (если настроен)
          queueId: currentQueueId?.value || null,
          sendWelcomeEmail: true,
        },
      })

      showCreateNewAuthor.value = false
      authorSearch.value = ''

      return newUser
    }
    catch (err: any) {
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
