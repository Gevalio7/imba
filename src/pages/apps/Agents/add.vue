<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { $api } from '@/utils/api'

definePage({
  meta: {
    navActiveLink: 'apps-agents',
  },
})

// Типы данных для Агент
interface Agent {
  firstName: string
  lastName: string
  login: string
  password: string
  email: string
  mobilePhone: string
  telegramAccount: string
  isActive: boolean
  roleId?: number | null
}

// Типы данных для Роль
interface Role {
  id: number
  name: string
}

// Типы данных для Группа агентов
interface AgentGroup {
  id: number
  name: string
}

// Типы данных для Очередь
interface Queue {
  id: number
  name: string
}

const router = useRouter()

const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref('')

// Данные агента
const agent = ref<Agent>({
  firstName: '',
  lastName: '',
  login: '',
  password: '',
  email: '',
  mobilePhone: '',
  telegramAccount: '',
  isActive: true,
  roleId: null,
})

// Данные ролей
const roles = ref<Role[]>([])
const rolesLoading = ref(false)

// Данные групп агентов
const agentGroups = ref<AgentGroup[]>([])
const agentGroupsLoading = ref(false)
const selectedGroupIds = ref<number[]>([])

// Данные очередей
const queues = ref<Queue[]>([])
const queuesLoading = ref(false)
const selectedQueueIds = ref<number[]>([])

// Вкладки
const userTab = ref(null)

const tabs = [
  { icon: 'bx-user', title: 'Основное' },
  { icon: 'bx-lock-alt', title: 'Безопасность' },
  { icon: 'bx-bell', title: 'Уведомления' },
]

// Пароль
const isPasswordVisible = ref(false)

// Уведомления
const notifications = ref([
  {
    type: 'Новые обращения',
    email: true,
    browser: false,
    app: false,
  },
  {
    type: 'Изменение статуса обращения',
    email: false,
    browser: true,
    app: true,
  },
  {
    type: 'Новые комментарии',
    email: true,
    browser: true,
    app: true,
  },
  {
    type: 'Назначение обращения',
    email: false,
    browser: true,
    app: false,
  },
  {
    type: 'Напоминания о SLA',
    email: true,
    browser: true,
    app: true,
  },
])

// Загрузка ролей
const fetchRoles = async () => {
  try {
    rolesLoading.value = true

    const data = await $api<{ roles: Role[]; total: number }>(`/roles`)

    roles.value = data.roles
  }
  catch (err) {
    console.error('Error fetching roles:', err)
  }
  finally {
    rolesLoading.value = false
  }
}

// Загрузка групп агентов
const fetchAgentGroups = async () => {
  try {
    agentGroupsLoading.value = true

    const data = await $api<{ agentGroups: AgentGroup[]; total: number }>(`/agents-groups`)

    agentGroups.value = data.agentGroups
  }
  catch (err) {
    console.error('Error fetching agent groups:', err)
  }
  finally {
    agentGroupsLoading.value = false
  }
}

// Загрузка очередей
const fetchQueues = async () => {
  try {
    queuesLoading.value = true

    const data = await $api<{ queues: Queue[]; total: number }>(`/queues`)

    queues.value = data.queues
  }
  catch (err) {
    console.error('Error fetching queues:', err)
  }
  finally {
    queuesLoading.value = false
  }
}

// Создание агента
const createAgent = async () => {
  if (!agent.value.firstName?.trim() || !agent.value.lastName?.trim()) {
    error.value = 'Имя и Фамилия обязательны для заполнения'

    return
  }

  if (!agent.value.password) {
    error.value = 'Пароль обязателен для заполнения'

    return
  }

  try {
    isSaving.value = true
    error.value = null

    const created = await $api<Agent>(`/agents`, {
      method: 'POST',
      body: {
        firstName: agent.value.firstName,
        lastName: agent.value.lastName,
        login: agent.value.login,
        password: agent.value.password,
        email: agent.value.email,
        mobilePhone: agent.value.mobilePhone,
        telegramAccount: agent.value.telegramAccount,
        isActive: agent.value.isActive,
        roleId: agent.value.roleId,
      },
    })

    // Обновляем группы агента
    if (created && selectedGroupIds.value.length > 0) {
      await $api(`/agents/${(created as any).id}/groups`, {
        method: 'PUT',
        body: { groupIds: selectedGroupIds.value },
      })
    }

    // Обновляем очереди агента
    if (created && selectedQueueIds.value.length > 0) {
      await $api(`/agents/${(created as any).id}/queues`, {
        method: 'PUT',
        body: { queueIds: selectedQueueIds.value },
      })
    }

    successMessage.value = 'Агент успешно создан'
    setTimeout(() => {
      router.push('/apps/Agents')
    }, 1500)
  }
  catch (err: any) {
    error.value = err.message || 'Ошибка создания агента'
  }
  finally {
    isSaving.value = false
  }
}

// Сохранение настроек уведомлений
const saveNotifications = async () => {
  try {
    isSaving.value = true
    error.value = null
    successMessage.value = 'Настройки уведомлений сохранены'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
  catch (err: any) {
    error.value = err.message || 'Ошибка сохранения настроек'
  }
  finally {
    isSaving.value = false
  }
}

// Навигация назад
const goBack = () => {
  router.push('/apps/Agents')
}

// Инициализация
onMounted(async () => {
  await Promise.all([
    fetchRoles(),
    fetchAgentGroups(),
    fetchQueues(),
  ])
  isLoading.value = false
})
</script>

<template>
  <!-- Сообщения об ошибках и успехе -->
  <VAlert
    v-if="error"
    type="error"
    variant="tonal"
    class="mb-4"
    closable
    @click:close="error = null"
  >
    {{ error }}
  </VAlert>

  <VAlert
    v-if="successMessage"
    type="success"
    variant="tonal"
    class="mb-4"
  >
    {{ successMessage }}
  </VAlert>

  <!-- Загрузка -->
  <div
    v-if="isLoading"
    class="d-flex justify-center pa-12"
  >
    <VProgressCircular
      indeterminate
      color="primary"
    />
  </div>

  <VRow v-else>
    <!-- Левая колонка - информация об агенте -->
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <VCard>
        <VCardText class="text-center pt-12">
          <!-- Аватар -->
          <VAvatar
            rounded
            :size="120"
            color="primary"
            variant="tonal"
            class="mb-4"
          >
            <span class="text-h3">
              {{ agent.firstName?.[0] || '' }}{{ agent.lastName?.[0] || '' }}
            </span>
          </VAvatar>

          <!-- Имя -->
          <h5 class="text-h5 mt-4">
            {{ agent.firstName || 'Новый' }} {{ agent.lastName || 'агент' }}
          </h5>

          <!-- Статус -->
          <VChip
            label
            :color="agent.isActive ? 'success' : 'error'"
            size="small"
            class="text-capitalize mt-4"
          >
            {{ agent.isActive ? 'Активен' : 'Неактивен' }}
          </VChip>
        </VCardText>

        <VCardText>
          <!-- Детали -->
          <h5 class="text-h5">
            Информация
          </h5>

          <VDivider class="my-4" />

          <VList class="card-list mt-2">
            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Email:
                  <span class="text-body-1">{{ agent.email || '-' }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Телефон:
                  <span class="text-body-1">{{ agent.mobilePhone || '-' }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Telegram:
                  <span class="text-body-1">{{ agent.telegramAccount || '-' }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Логин:
                  <span class="text-body-1">{{ agent.login || '-' }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>

        <!-- Кнопки -->
        <VCardText class="d-flex justify-center gap-x-4">
          <VBtn
            variant="elevated"
            :loading="isSaving"
            @click="createAgent"
          >
            Создать
          </VBtn>

          <VBtn
            variant="tonal"
            color="error"
            @click="goBack"
          >
            Отмена
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Правая колонка - вкладки -->
    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VTabs
        v-model="userTab"
        class="v-tabs-pill"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.icon"
        >
          <VIcon
            :size="18"
            :icon="tab.icon"
            class="me-1"
          />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>

      <VDivider />

      <VWindow
        v-model="userTab"
        class="mt-6 disable-tab-transition"
        :touch="false"
      >
        <!-- Вкладка: Основное -->
        <VWindowItem>
          <VCard>
            <VCardText>
              <VRow>
                <!-- Имя -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="agent.firstName"
                    label="Имя *"
                    placeholder="Введите имя"
                  />
                </VCol>

                <!-- Фамилия -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="agent.lastName"
                    label="Фамилия *"
                    placeholder="Введите фамилию"
                  />
                </VCol>

                <!-- Логин -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="agent.login"
                    label="Логин"
                    placeholder="Введите логин"
                  />
                </VCol>

                <!-- Email -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="agent.email"
                    label="Email"
                    type="email"
                    placeholder="Введите email"
                  />
                </VCol>

                <!-- Мобильный телефон -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="agent.mobilePhone"
                    label="Мобильный телефон"
                    placeholder="+7 (999) 123-45-67"
                  />
                </VCol>

                <!-- Телеграмм акк -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="agent.telegramAccount"
                    label="Телеграмм аккаунт"
                    placeholder="@username"
                  />
                </VCol>

                <!-- Роль -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppSelect
                    v-model="agent.roleId"
                    :items="roles.map(r => ({ title: r.name, value: r.id }))"
                    label="Роль"
                    clearable
                    :loading="rolesLoading"
                  />
                </VCol>

                <!-- Активен -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <VSwitch
                    v-model="agent.isActive"
                    label="Активен"
                    color="primary"
                  />
                </VCol>

                <!-- Группы агентов -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppSelect
                    v-model="selectedGroupIds"
                    :items="agentGroups.map(g => ({ title: g.name, value: g.id }))"
                    label="Группы агентов"
                    multiple
                    chips
                    closable-chips
                    :loading="agentGroupsLoading"
                  />
                </VCol>

                <!-- Очереди -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppSelect
                    v-model="selectedQueueIds"
                    :items="queues.map(q => ({ title: q.name, value: q.id }))"
                    label="Очереди"
                    multiple
                    chips
                    closable-chips
                    :loading="queuesLoading"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VWindowItem>

        <!-- Вкладка: Безопасность -->
        <VWindowItem>
          <VCard>
            <VCardText>
              <VAlert
                variant="tonal"
                color="warning"
                class="mb-4"
                title="Требования к паролю"
                text="Минимум 6 символов"
              />

              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="agent.password"
                    label="Пароль *"
                    placeholder="Введите пароль"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                    @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VWindowItem>

        <!-- Вкладка: Уведомления -->
        <VWindowItem>
          <VCard
            title="Уведомления"
            subtitle="Выберите, как вы хотите получать уведомления"
          >
            <VCardText class="px-0">
              <VDivider />
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th scope="col">
                      ТИП
                    </th>
                    <th scope="col">
                      EMAIL
                    </th>
                    <th scope="col">
                      БРАУЗЕР
                    </th>
                    <th scope="col">
                      ПРИЛОЖЕНИЕ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="notification in notifications"
                    :key="notification.type"
                  >
                    <td class="text-high-emphasis">
                      {{ notification.type }}
                    </td>
                    <td>
                      <VCheckbox
                        v-model="notification.email"
                        hide-details
                      />
                    </td>
                    <td>
                      <VCheckbox
                        v-model="notification.browser"
                        hide-details
                      />
                    </td>
                    <td>
                      <VCheckbox
                        v-model="notification.app"
                        hide-details
                      />
                    </td>
                  </tr>
                </tbody>
              </VTable>
              <VDivider />
            </VCardText>

            <VCardText class="d-flex flex-wrap gap-4">
              <VBtn
                color="primary"
                :loading="isSaving"
                @click="saveNotifications"
              >
                Сохранить изменения
              </VBtn>
            </VCardText>
          </VCard>
        </VWindowItem>
      </VWindow>
    </VCol>
  </VRow>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.5rem;
}

.disable-tab-transition {
  transition: none !important;
}
</style>
