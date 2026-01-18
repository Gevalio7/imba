import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функция для преобразования имени сущности в camelCase
function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Функция для преобразования имени сущности в camelCase для URL
function toRouteCase(str) {
  // Преобразуем в camelCase для соответствия именам файлов роутов
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Функция для получения русского названия сущности
function getRussianName(entityName) {
  const russianNames = {
    'SLA': 'SLA',
    'Priorities': 'Приоритеты',
    'States': 'Состояния',
    'Types': 'Типы',
    'Queues': 'Очереди',
    'Services': 'Сервисы',
    'Signatures': 'Подписи',
    'Greetings': 'Приветствия',
    'EmailAddresses': 'Email адреса',
    'AutoResponses': 'Автоответы',
    'Attachments': 'Вложения',
    'Templates': 'Шаблоны',
    'Calendars': 'Календари',
    'Agents': 'Агенты',
    'AgentsGroups': 'Группы агентов',
    'AgentsRoles': 'Роли агентов',
    'Customers': 'Клиенты',
    'CustomersGroups': 'Группы клиентов',
    'CustomerUsers': 'Пользователи клиентов',
    'CustomerUsersGroups': 'Группы пользователей клиентов',
    'CustomerUsersServices': 'Сервисы пользователей клиентов',
    'CustomerUsersCustomers': 'Клиенты пользователей',
    'Roles': 'Роли',
    'RolesGroups': 'Группы ролей',
    'Groups': 'Группы',
    'DynamicFields': 'Динамические поля',
    'DynamicFieldsScreens': 'Экраны динамических полей',
    'GenericAgent': 'Универсальный агент',
    'ProcessManagement': 'Управление процессами',
    'SessionManagement': 'Управление сессиями',
    'SystemConfiguration': 'Конфигурация системы',
    'SystemMaintenance': 'Обслуживание системы',
    'SystemLog': 'Системный журнал',
    'SystemFileSupport': 'Поддержка файлов системы',
    'WebServices': 'Веб-сервисы',
    'OAuth2': 'OAuth2',
    'PackageManager': 'Менеджер пакетов',
    'PerformanceLog': 'Журнал производительности',
    'PgpKeys': 'PGP ключи',
    'PostMasterFilters': 'Фильтры PostMaster',
    'PostMasterMailAccounts': 'Почтовые аккаунты PostMaster',
    'QueueAutoResponse': 'Автоответы очередей',
    'SmimeCertificates': 'S/MIME сертификаты',
    'SqlBox': 'SQL Box',
    'SupportDataCollector': 'Сборщик данных поддержки',
    'TemplateAttachments': 'Вложения шаблонов',
    'TemplateQueues': 'Очереди шаблонов',
    'TicketAttributeRelations': 'Связи атрибутов тикетов',
    'TicketNotifications': 'Уведомления тикетов',
    'Translation': 'Переводы',
    'AdminNotification': 'Уведомления администратора',
    'AppointmentNotifications': 'Уведомления о встречах',
    'CommunicationLog': 'Журнал коммуникаций',
    'GeneralCatalog': 'Общий каталог',
    'Acl': 'ACL (Контроль доступа)'
  };
  
  return russianNames[entityName] || entityName;
}

// Функция для получения русского названия в единственном числе
function getRussianNameSingular(entityName) {
  const russianNamesSingular = {
    'SLA': 'SLA',
    'Priorities': 'Приоритет',
    'States': 'Состояние',
    'Types': 'Тип',
    'Queues': 'Очередь',
    'Services': 'Сервис',
    'Signatures': 'Подпись',
    'Greetings': 'Приветствие',
    'EmailAddresses': 'Email адрес',
    'AutoResponses': 'Автоответ',
    'Attachments': 'Вложение',
    'Templates': 'Шаблон',
    'Calendars': 'Календарь',
    'Agents': 'Агент',
    'AgentsGroups': 'Группа агентов',
    'AgentsRoles': 'Роль агентов',
    'Customers': 'Клиент',
    'CustomersGroups': 'Группа клиентов',
    'CustomerUsers': 'Пользователь клиента',
    'CustomerUsersGroups': 'Группа пользователей клиентов',
    'CustomerUsersServices': 'Сервис пользователей клиентов',
    'CustomerUsersCustomers': 'Клиент пользователя',
    'Roles': 'Роль',
    'RolesGroups': 'Группа ролей',
    'Groups': 'Группа',
    'DynamicFields': 'Динамическое поле',
    'DynamicFieldsScreens': 'Экран динамических полей',
    'GenericAgent': 'Универсальный агент',
    'ProcessManagement': 'Управление процессом',
    'SessionManagement': 'Управление сессией',
    'SystemConfiguration': 'Конфигурация системы',
    'SystemMaintenance': 'Обслуживание системы',
    'SystemLog': 'Системный журнал',
    'SystemFileSupport': 'Поддержка файлов системы',
    'WebServices': 'Веб-сервис',
    'OAuth2': 'OAuth2',
    'PackageManager': 'Менеджер пакетов',
    'PerformanceLog': 'Журнал производительности',
    'PgpKeys': 'PGP ключ',
    'PostMasterFilters': 'Фильтр PostMaster',
    'PostMasterMailAccounts': 'Почтовый аккаунт PostMaster',
    'QueueAutoResponse': 'Автоответ очереди',
    'SmimeCertificates': 'S/MIME сертификат',
    'SqlBox': 'SQL Box',
    'SupportDataCollector': 'Сборщик данных поддержки',
    'TemplateAttachments': 'Вложение шаблона',
    'TemplateQueues': 'Очередь шаблона',
    'TicketAttributeRelations': 'Связь атрибутов тикета',
    'TicketNotifications': 'Уведомление тикета',
    'Translation': 'Перевод',
    'AdminNotification': 'Уведомление администратора',
    'AppointmentNotifications': 'Уведомление о встрече',
    'CommunicationLog': 'Журнал коммуникации',
    'GeneralCatalog': 'Общий каталог',
    'Acl': 'ACL (Контроль доступа)'
  };
  
  return russianNamesSingular[entityName] || entityName;
}

// Функция для генерации TypeScript интерфейса
function generateInterface(entityName, fields) {
  let interfaceCode = `interface ${entityName} {\n`;
  interfaceCode += `  id: number\n`;
  
  for (const [fieldName, fieldType] of Object.entries(fields)) {
    interfaceCode += `  ${fieldName}: ${fieldType}\n`;
  }
  
  interfaceCode += `  createdAt: string\n`;
  interfaceCode += `  updatedAt: string\n`;
  interfaceCode += `}\n`;
  
  return interfaceCode;
}

// Функция для генерации заголовков таблицы
function generateHeaders(fields) {
  const headers = [
    `{ title: 'ID', key: 'id', sortable: true }`,
  ];
  
  for (const fieldName of Object.keys(fields)) {
    // Пропускаем некоторые поля
    if (['isActive', 'status'].includes(fieldName)) continue;
    
    const russianFieldNames = {
      'name': 'Название',
      'description': 'Описание',
      'color': 'Цвет',
      'responseTime': 'Время ответа (ч)',
      'resolutionTime': 'Время решения (ч)',
      'comment': 'Комментарий',
      'message': 'Сообщение',
      'email': 'Email',
      'phone': 'Телефон',
      'address': 'Адрес',
      'city': 'Город',
      'country': 'Страна',
      'zip': 'Индекс',
      'street': 'Улица',
      'content': 'Содержание',
      'trigger': 'Триггер',
      'response': 'Ответ',
      'delay': 'Задержка',
      'fileName': 'Имя файла',
      'type': 'Тип',
      'timezone': 'Часовой пояс',
      'workHours': 'Рабочие часы',
      'label': 'Метка',
      'fieldType': 'Тип поля',
      'defaultValue': 'Значение по умолчанию',
      'isRequired': 'Обязательное',
      'screenName': 'Имя экрана',
      'fieldName': 'Имя поля',
      'position': 'Позиция',
      'triggerType': 'Тип триггера',
      'schedule': 'Расписание',
      'lastRun': 'Последний запуск',
      'nextRun': 'Следующий запуск',
      'clientId': 'ID клиента',
      'clientSecret': 'Секрет клиента',
      'authorizationUrl': 'URL авторизации',
      'tokenUrl': 'URL токена',
      'scopes': 'Области',
      'version': 'Версия',
      'author': 'Автор',
      'isInstalled': 'Установлен',
      'isUpgradable': 'Доступно обновление',
      'processType': 'Тип процесса',
      'lastExecuted': 'Последнее выполнение',
      'nextExecution': 'Следующее выполнение',
      'maxTickets': 'Макс. тикетов',
      'priority': 'Приоритет',
      'username': 'Имя пользователя',
      'ipAddress': 'IP адрес',
      'userAgent': 'User Agent',
      'loginTime': 'Время входа',
      'lastActivity': 'Последняя активность',
      'value': 'Значение',
      'configType': 'Тип конфигурации',
      'isEditable': 'Редактируемый',
      'startTime': 'Время начала',
      'endTime': 'Время окончания',
      'isScheduled': 'Запланировано',
      'sourceAttribute': 'Исходный атрибут',
      'targetAttribute': 'Целевой атрибут',
      'relationType': 'Тип связи',
      'endpoint': 'Конечная точка',
      'method': 'Метод',
      'lastTested': 'Последнее тестирование',
      'permissions': 'Разрешения'
    };
    
    const title = russianFieldNames[fieldName] || fieldName;
    headers.push(`{ title: '${title}', key: '${fieldName}', sortable: true }`);
  }
  
  headers.push(`{ title: 'Создано', key: 'createdAt', sortable: true }`);
  headers.push(`{ title: 'Изменено', key: 'updatedAt', sortable: true }`);
  headers.push(`{ title: 'Статус', key: 'status', sortable: false }`);
  headers.push(`{ title: 'Активен', key: 'isActive', sortable: false }`);
  headers.push(`{ title: 'Действия', key: 'actions', sortable: false }`);
  
  return headers.join(',\n  ');
}

// Функция для генерации полей формы редактирования
function generateFormFields(fields) {
  let formFields = '';
  
  for (const [fieldName, fieldType] of Object.entries(fields)) {
    // Пропускаем некоторые поля
    if (['isActive', 'status', 'createdAt', 'updatedAt', 'id'].includes(fieldName)) continue;
    
    const russianFieldNames = {
      'name': 'Название',
      'description': 'Описание',
      'color': 'Цвет',
      'responseTime': 'Время ответа (часы)',
      'resolutionTime': 'Время решения (часы)',
      'comment': 'Комментарий',
      'message': 'Сообщение',
      'email': 'Email',
      'phone': 'Телефон',
      'address': 'Адрес',
      'city': 'Город',
      'country': 'Страна',
      'zip': 'Индекс',
      'street': 'Улица',
      'content': 'Содержание',
      'trigger': 'Триггер',
      'response': 'Ответ',
      'delay': 'Задержка',
      'fileName': 'Имя файла',
      'type': 'Тип',
      'timezone': 'Часовой пояс',
      'workHours': 'Рабочие часы',
      'label': 'Метка',
      'fieldType': 'Тип поля',
      'defaultValue': 'Значение по умолчанию',
      'isRequired': 'Обязательное',
      'screenName': 'Имя экрана',
      'fieldName': 'Имя поля',
      'position': 'Позиция',
      'triggerType': 'Тип триггера',
      'schedule': 'Расписание',
      'lastRun': 'Последний запуск',
      'nextRun': 'Следующий запуск',
      'clientId': 'ID клиента',
      'clientSecret': 'Секрет клиента',
      'authorizationUrl': 'URL авторизации',
      'tokenUrl': 'URL токена',
      'scopes': 'Области',
      'version': 'Версия',
      'author': 'Автор',
      'isInstalled': 'Установлен',
      'isUpgradable': 'Доступно обновление',
      'processType': 'Тип процесса',
      'lastExecuted': 'Последнее выполнение',
      'nextExecution': 'Следующее выполнение',
      'maxTickets': 'Макс. тикетов',
      'priority': 'Приоритет',
      'username': 'Имя пользователя',
      'ipAddress': 'IP адрес',
      'userAgent': 'User Agent',
      'loginTime': 'Время входа',
      'lastActivity': 'Последняя активность',
      'value': 'Значение',
      'configType': 'Тип конфигурации',
      'isEditable': 'Редактируемый',
      'startTime': 'Время начала',
      'endTime': 'Время окончания',
      'isScheduled': 'Запланировано',
      'sourceAttribute': 'Исходный атрибут',
      'targetAttribute': 'Целевой атрибут',
      'relationType': 'Тип связи',
      'endpoint': 'Конечная точка',
      'method': 'Метод',
      'lastTested': 'Последнее тестирование',
      'permissions': 'Разрешения'
    };
    
    const label = russianFieldNames[fieldName] || fieldName;
    const isRequired = fieldName === 'name' ? ' *' : '';
    
    // Определяем тип поля
    let fieldComponent = 'AppTextField';
    let fieldProps = '';
    
    if (fieldType.includes('number')) {
      fieldProps = `\n                type="number"\n                min="0"`;
      if (fieldName.includes('Time')) {
        fieldProps += `\n                step="0.25"`;
      }
    } else if (fieldName === 'color') {
      fieldProps = `\n                type="color"`;
    } else if (fieldName.includes('description') || fieldName.includes('comment') || fieldName.includes('message') || fieldName.includes('content')) {
      fieldComponent = 'AppTextarea';
      fieldProps = `\n                rows="3"\n                placeholder="Введите ${label.toLowerCase()}..."`;
    } else if (fieldType.includes('boolean')) {
      fieldComponent = 'VSwitch';
      fieldProps = `\n                color="primary"`;
    }
    
    formFields += `
            <!-- ${label} -->
            <VCol
              cols="12"
              ${fieldName === 'name' || fieldType.includes('number') ? 'sm="6"' : ''}
            >
              <${fieldComponent}
                v-model="editedItem.${fieldName}"
                label="${label}${isRequired}"${fieldProps}
              />
            </VCol>
`;
  }
  
  return formFields;
}

// Функция для генерации Vue компонента
function generateVueComponent(entityName, fields) {
  const camelCaseName = toCamelCase(entityName);
  const routeName = toRouteCase(entityName);
  const russianName = getRussianName(entityName);
  const russianNameSingular = getRussianNameSingular(entityName);
  const interfaceCode = generateInterface(entityName, fields);
  const headers = generateHeaders(fields);
  const formFields = generateFormFields(fields);
  
  // Получаем первое поле для defaultItem
  const firstField = Object.keys(fields)[0];
  const firstFieldType = fields[firstField];
  let defaultValue = "''";
  if (firstFieldType.includes('number')) {
    defaultValue = '0';
  } else if (firstFieldType.includes('boolean')) {
    defaultValue = 'false';
  } else if (firstFieldType.includes('[]')) {
    defaultValue = '[]';
  }
  
  // Генерируем defaultItem
  let defaultItemFields = '';
  for (const [fieldName, fieldType] of Object.entries(fields)) {
    if (['isActive', 'status'].includes(fieldName)) continue;
    
    let value = "''";
    if (fieldType.includes('number')) {
      value = fieldName.includes('Time') ? '4' : '0';
    } else if (fieldType.includes('boolean')) {
      value = 'false';
    } else if (fieldType.includes('[]')) {
      value = '[]';
    } else if (fieldType.includes('null')) {
      value = 'null';
    }
    
    defaultItemFields += `  ${fieldName}: ${value},\n`;
  }
  
  return `<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'

// Типы данных для ${russianNameSingular}
${interfaceCode}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Данные ${russianName.toLowerCase()}
const ${camelCaseName} = ref<${entityName}[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных из API
const fetch${entityName} = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Fetching ${camelCaseName} from:', \`\${API_BASE}/${routeName}\`)
    const data = await $fetch<{ ${camelCaseName}: ${entityName}[], total: number }>(\`\${API_BASE}/${routeName}\`)
    console.log('Fetched ${camelCaseName} data:', data)
    ${camelCaseName}.value = data.${camelCaseName}
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки ${russianName.toLowerCase()}'
    console.error('Error fetching ${camelCaseName}:', err)
  } finally {
    loading.value = false
  }
}

// Создание ${russianNameSingular.toLowerCase()}
const create${entityName} = async (item: Omit<${entityName}, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<${entityName}>(\`\${API_BASE}/${routeName}\`, {
      method: 'POST',
      body: item
    })
    ${camelCaseName}.value.push(data)
    return data
  } catch (err) {
    console.error('Error creating ${camelCaseName}:', err)
    throw err
  }
}

// Обновление ${russianNameSingular.toLowerCase()}
const update${entityName} = async (id: number, item: Omit<${entityName}, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $fetch<${entityName}>(\`\${API_BASE}/${routeName}/\${id}\`, {
      method: 'PUT',
      body: item
    })
    const index = ${camelCaseName}.value.findIndex(p => p.id === id)
    if (index !== -1) {
      ${camelCaseName}.value[index] = data
    }
    return data
  } catch (err) {
    console.error('Error updating ${camelCaseName}:', err)
    throw err
  }
}

// Удаление ${russianNameSingular.toLowerCase()}
const delete${entityName} = async (id: number) => {
  try {
    await $fetch(\`\${API_BASE}/${routeName}/\${id}\`, {
      method: 'DELETE'
    })
    const index = ${camelCaseName}.value.findIndex(p => p.id === id)
    if (index !== -1) {
      ${camelCaseName}.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Error deleting ${camelCaseName}:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetch${entityName}()
})

const headers = [
  ${headers}
]

// Фильтрация
const filtered${entityName} = computed(() => {
  let filtered = ${camelCaseName}.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(p => p.status === statusFilter.value)
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
}

// Массовые действия
const bulkDelete = () => {
  console.log('🗑️ Массовое удаление - вызвано')
  console.log('📋 Выбранные элементы:', selectedItems.value)
  console.log('📊 Количество выбранных элементов:', selectedItems.value.length)
  isBulkDeleteDialogOpen.value = true
}

const bulkChangeStatus = () => {
  console.log('🔄 Массовое изменение статуса - вызвано')
  console.log('📋 Выбранные элементы:', selectedItems.value)
  console.log('📊 Количество выбранных элементов:', selectedItems.value.length)
  isBulkStatusDialogOpen.value = true
}

const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await delete${entityName}(item.id)
    }
    selectedItems.value = []
    showToast(\`Удалено \${count} ${russianName.toLowerCase()}\`)
    isBulkDeleteDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await update${entityName}(item.id, {
        ...item,
        status: bulkStatusValue.value,
        isActive: bulkStatusValue.value === 1
      })
    }
    selectedItems.value = []
    showToast(\`Статус изменен для \${count} ${russianName.toLowerCase()}\`)
    isBulkStatusDialogOpen.value = false
  } catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

const resolveStatusVariant = (status: number) => {
  if (status === 1)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Фильтры
const statusFilter = ref<number | null>(null)
const isFilterDialogOpen = ref(false)

// Массовые действия
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const bulkStatusValue = ref<number>(1)

// Отслеживание изменений выбранных элементов
watch(selectedItems, (newValue) => {
  console.log('✅ Изменение выбранных элементов')
  console.log('📋 Новое значение selectedItems:', newValue)
  console.log('📊 Количество выбранных:', newValue.length)
  console.log('🔍 Детали выбранных элементов:', JSON.stringify(newValue, null, 2))
}, { deep: true })

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<${entityName}>({
  id: -1,
${defaultItemFields}  createdAt: '',
  updatedAt: '',
  status: 1,
  isActive: true,
})

const editedItem = ref<${entityName}>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: ${entityName}) => {
  editedIndex.value = ${camelCaseName}.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: ${entityName}) => {
  editedIndex.value = ${camelCaseName}.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const save = async () => {
  if (!editedItem.value.name?.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  try {
    if (editedIndex.value > -1) {
      // Обновление существующего
      const updated = await update${entityName}(editedItem.value.id, {
        ...editedItem.value,
        status: editedItem.value.status,
        isActive: editedItem.value.status === 1
      })
      showToast('${russianNameSingular} успешно сохранен')
    } else {
      // Добавление нового
      const created = await create${entityName}({
        ...editedItem.value,
        status: editedItem.value.status,
        isActive: editedItem.value.status === 1
      })
      showToast('${russianNameSingular} успешно добавлен')
    }
    close()
  } catch (err) {
    showToast('Ошибка сохранения ${russianNameSingular.toLowerCase()}', 'error')
  }
}

const deleteItemConfirm = async () => {
  try {
    await delete${entityName}(editedItem.value.id)
    showToast('${russianNameSingular} успешно удален')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления ${russianNameSingular.toLowerCase()}', 'error')
  }
}

// Переключение статуса
const toggleStatus = async (item: ${entityName}, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)

  try {
    await update${entityName}(item.id, {
      ...item,
      status: newValue,
      isActive: newValue === 1
    })
    showToast('Статус ${russianNameSingular.toLowerCase()} изменен')
  } catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}

// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Добавление нового ${russianNameSingular.toLowerCase()}
const addNew${entityName} = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="${russianName}">

      <!-- Индикатор загрузки -->
      <div v-if="loading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Сообщение об ошибке -->
      <div v-else-if="error" class="d-flex justify-center pa-6">
        <VAlert type="error" class="ma-4">
          {{ error }}
        </VAlert>
      </div>

      <div v-else class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск ${russianName.toLowerCase()}"
            style="inline-size: 250px;"
            class="me-3"
          />
        </div>

        <!-- Кнопка фильтра -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-filter"
          @click="isFilterDialogOpen = true"
        >
          Фильтр
        </VBtn>

        <!-- Кнопка массовых действий -->
        <VMenu
          v-model="isBulkActionsMenuOpen"
          :close-on-content-click="false"
        >
          <template #activator="{ props }">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="bx-dots-vertical-rounded"
              :disabled="selectedItems.length === 0"
              v-bind="props"
            >
              Действия ({{ selectedItems.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                bulkDelete()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                bulkChangeStatus()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Изменить статус</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VSpacer />
        <div class="d-flex gap-4 flex-wrap align-center">
          <AppSelect
            v-model="itemsPerPage"
            :items="[5, 10, 20, 25, 50]"
          />
          <!-- Экспорт -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-export"
          >
            Экспорт
          </VBtn>

          <VBtn
            color="primary"
            prepend-icon="bx-plus"
            @click="addNew${entityName}"
          >
            Добавить ${russianNameSingular.toLowerCase()}
          </VBtn>
        </div>
      </div>


      <!-- Диалог фильтров -->
      <VDialog
        v-model="isFilterDialogOpen"
        max-width="500px"
      >
        <VCard title="Фильтры">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="statusFilter"
                  placeholder="Статус"
                  :items="[
                    { title: 'Активен', value: 1 },
                    { title: 'Не активен', value: 2 },
                  ]"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
          </VCardText>

          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                variant="text"
                @click="clearFilters"
              >
                Сбросить
              </VBtn>
              <VBtn
                color="error"
                variant="outlined"
                @click="isFilterDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="isFilterDialogOpen = false"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового удаления -->
      <VDialog
        v-model="isBulkDeleteDialogOpen"
        max-width="500px"
      >
        <VCard title="Подтверждение удаления">
          <VCardText>
            Вы уверены, что хотите удалить выбранные ${russianName.toLowerCase()}? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkDeleteDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkDelete"
              >
                Удалить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового изменения статуса -->
      <VDialog
        v-model="isBulkStatusDialogOpen"
        max-width="500px"
      >
        <VCard title="Изменить статус">
          <VCardText>
            <AppSelect
              v-model="bulkStatusValue"
              :items="statusOptions"
              item-title="text"
              item-value="value"
              label="Новый статус"
            />
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkStatusDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkStatusChange"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <VDivider />

      <!-- Таблица -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filtered${entityName}"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Статус -->
        <template #item.status="{ item }">
          <VChip
            v-bind="resolveStatusVariant(item.status)"
            density="default"
            label
            size="small"
          />
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <VSwitch
            :model-value="item.isActive"
            @update:model-value="(val) => {
              toggleStatus(item, val ? 1 : 2)
            }"
          />
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="editItem(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn @click="deleteItem(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filtered${entityName}.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать ${russianNameSingular.toLowerCase()}' : 'Добавить ${russianNameSingular.toLowerCase()}'">
        <VCardText>
          <VRow>
${formFields}
            <!-- Статус -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.status"
                :items="statusOptions"
                item-title="text"
                item-value="value"
                label="Статус"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="self-align-end d-flex gap-4 justify-end">
            <VBtn
              color="error"
              variant="outlined"
              @click="close"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="save"
            >
              Сохранить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления -->
    <VDialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этот ${russianNameSingular.toLowerCase()}?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>

  <!-- Уведомления -->
  <VSnackbar
    v-model="isToastVisible"
    :color="toastColor"
    timeout="3000"
  >
    {{ toastMessage }}
  </VSnackbar>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
`;
}

// Основная функция
function main() {
  const configPath = path.join(__dirname, 'entities-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  console.log('Начинаем генерацию Vue страниц...\n');
  
  let generatedCount = 0;
  let skippedCount = 0;
  
  for (const [entityName, fields] of Object.entries(config)) {
    // Пропускаем массивы и сущности без полей
    if (Array.isArray(fields) || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      console.log(`⏭️  Пропускаем ${entityName} (нет полей или массив)`);
      skippedCount++;
      continue;
    }
    
    // Генерируем Vue компонент
    const vueComponent = generateVueComponent(entityName, fields);
    
    // Определяем путь для сохранения файла
    // Пытаемся найти существующий файл
    const possiblePaths = [
      `../src/pages/apps/settings/ticket-settings/${entityName}.vue`,
      `../src/pages/apps/settings/administration/${entityName}.vue`,
      `../src/pages/apps/settings/communication-notifications/${entityName}.vue`,
      `../src/pages/apps/settings/processes-automation/${entityName}.vue`,
      `../src/pages/apps/settings/users-groups-roles/${entityName}.vue`,
    ];
    
    let outputPath = null;
    for (const possiblePath of possiblePaths) {
      const fullPath = path.join(__dirname, possiblePath);
      if (fs.existsSync(fullPath)) {
        outputPath = fullPath;
        break;
      }
    }
    
    // Если файл не найден, создаем в ticket-settings
    if (!outputPath) {
      outputPath = path.join(__dirname, `../src/pages/apps/settings/ticket-settings/${entityName}.vue`);
    }
    
    // Создаем директорию если не существует
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Сохраняем файл
    fs.writeFileSync(outputPath, vueComponent);
    console.log(`✅ Сгенерирован: ${path.relative(path.join(__dirname, '..'), outputPath)}`);
    generatedCount++;
  }
  
  console.log(`\n📊 Итого:`);
  console.log(`   ✅ Сгенерировано: ${generatedCount}`);
  console.log(`   ⏭️  Пропущено: ${skippedCount}`);
  console.log(`\n✨ Генерация завершена!`);
}

main();
