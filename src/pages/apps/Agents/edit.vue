<script setup lang="ts">
import { $api } from '@/utils/api'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AgentActivityTimeline from '../../../views/apps/agents/view/AgentActivityTimeline.vue'

definePage({
  meta: {
    navActiveLink: 'apps-agents',
  },
})

// Типы данных для Агент
interface Agent {
  id: number
  firstName: string
  lastName: string
  login: string
  email: string
  mobilePhone: string
  telegramAccount: string
  isActive: boolean
  createdAt: string
  roleId?: number | null
  avatar?: string | null
}









const route = useRoute()
const router = useRouter()

const agentId = ref<number | null>(null)

const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref('')

// Данные агента
const agent = ref<Agent>({
  id: 0,
  firstName: '',
  lastName: '',
  login: '',
  email: '',
  mobilePhone: '',
  telegramAccount: '',
  isActive: true,
  createdAt: '',
  roleId: null,
  avatar: null,
})







// Вкладки
const userTab = ref(null)

const tabs = [
  { icon: 'bx-user', title: 'Основное' },
  { icon: 'bx-lock-alt', title: 'Безопасность' },
  { icon: 'bx-bell', title: 'Уведомления' },
  { icon: 'bx-time', title: 'Активность' },
]

// Пароль
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

// Доступные аватарки (локальные файлы)
const availableAvatars = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
  '/avatars/avatar6.png',
  '/avatars/avatar7.png',
  '/avatars/avatar8.png',
]

// Функция для загрузки файла
const handleAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      error.value = 'Размер файла не должен превышать 5MB'
      return
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      error.value = 'Пожалуйста, выберите изображение'
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      agent.value.avatar = e.target?.result as string
      error.value = null // Очищаем ошибку при успешной загрузке
    }
    reader.readAsDataURL(file)
  }
}

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











// Загрузка данных агента
const fetchAgent = async () => {
  if (!agentId.value) {
    error.value = 'ID агента не указан'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    const data = await $api<Agent>(`/agents/${agentId.value}`)
    agent.value = data

    // Если загружаем текущего пользователя, обновляем userData в cookie
    const userData = useCookie<any>('userData')
    if (userData.value && Number(userData.value.id) === agentId.value) {
      userData.value.avatar = data.avatar
    }
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки агента'
  } finally {
    isLoading.value = false
  }
}

// Сохранение данных агента
const saveAgent = async () => {

  try {
    isSaving.value = true
    error.value = null

    const updatedAgent = await $api(`/agents/${agentId.value}`, {
      method: 'PUT',
      body: {
        firstName: agent.value.firstName,
        lastName: agent.value.lastName,
        login: agent.value.login,
        email: agent.value.email || null,
        mobilePhone: agent.value.mobilePhone,
        telegramAccount: agent.value.telegramAccount,
        isActive: agent.value.isActive,
        roleId: agent.value.roleId,
        avatar: agent.value.avatar,
      }
    }) as Agent

    // Обновляем локальные данные агента
    agent.value = updatedAgent

    // Если редактируем текущего пользователя, обновляем userData в cookie
    const userData = useCookie<any>('userData')
    if (userData.value && Number(userData.value.id) === agentId.value) {
      userData.value.avatar = updatedAgent.avatar
    }

    successMessage.value = 'Агент успешно обновлён'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err: any) {
    error.value = err.message || 'Ошибка обновления агента'
  } finally {
    isSaving.value = false
  }
}


// Изменение пароля
const changePassword = async () => {
  if (!newPassword.value) {
    error.value = 'Введите новый пароль'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают'
    return
  }

  if (newPassword.value.length < 6) {
    error.value = 'Пароль должен быть не менее 6 символов'
    return
  }

  try {
    isSaving.value = true
    error.value = null
    await $api(`/agents/${agentId.value}`, {
      method: 'PUT',
      body: {
        password: newPassword.value
      }
    })

    newPassword.value = ''
    confirmPassword.value = ''
    successMessage.value = 'Пароль успешно изменён'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err: any) {
    error.value = err.message || 'Ошибка изменения пароля'
  } finally {
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
  } catch (err: any) {
    error.value = err.message || 'Ошибка сохранения настроек'
  } finally {
    isSaving.value = false
  }
}





// Навигация назад
const goBack = () => {
  router.push('/apps/Agents')
}

// Инициализация
onMounted(async () => {
  const id = route.query.id
  agentId.value = id ? Number(id) : null
  if (agentId.value) {
    await fetchAgent()
  } else {
    error.value = 'ID агента не указан'
    isLoading.value = false
  }
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
  <div v-if="isLoading" class="d-flex justify-center pa-12">
    <VProgressCircular indeterminate color="primary" />
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
            <img v-if="agent.avatar" :src="agent.avatar" alt="Avatar" />
            <span v-else class="text-h3">
              {{ agent.firstName?.[0] || '' }}{{ agent.lastName?.[0] || '' }}
            </span>
          </VAvatar>

          <!-- Имя -->
          <h5 class="text-h5 mt-4">
            {{ agent.firstName }} {{ agent.lastName }}
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
                  ID:
                  <span class="text-body-1">{{ agent.id }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

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

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Создан:
                  <span class="text-body-1">{{ new Date(agent.createdAt).toLocaleDateString() }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>

        <!-- Кнопки -->
        <VCardText class="d-flex justify-center gap-x-4">
          <VBtn
            variant="elevated"
            @click="saveAgent"
            :loading="isSaving"
          >
            Сохранить
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

                 <!-- Аватарка -->
                 <VCol cols="12">
                   <h6 class="text-h6 mb-3">Выберите аватарку</h6>
                   <VRow class="ga-3">
                     <VCol cols="auto">
                       <VAvatar
                         rounded
                         :size="60"
                         color="grey-lighten-2"
                         variant="outlined"
                         class="cursor-pointer"
                         @click="agent.avatar = null"
                       >
                         <VIcon icon="bx-user" size="24" />
                       </VAvatar>
                       <div class="text-center text-caption mt-1">Без аватара</div>
                     </VCol>
                     <VCol
                       v-for="(avatar, index) in availableAvatars"
                       :key="index"
                       cols="auto"
                     >
                       <VAvatar
                         rounded
                         :size="60"
                         class="cursor-pointer"
                         :class="{ 'v-avatar--selected': agent.avatar === avatar }"
                         @click="agent.avatar = avatar"
                       >
                         <img :src="avatar" alt="Avatar option" />
                       </VAvatar>
                     </VCol>
                   </VRow>

                   <!-- Загрузка своей аватарки -->
                   <VRow class="mt-4">
                     <VCol cols="12">
                       <h6 class="text-h6 mb-2">Или загрузите свою аватарку</h6>
                       <VFileInput
                         label="Выберите изображение"
                         accept="image/*"
                         @change="handleAvatarUpload"
                         prepend-icon="bx-image"
                         show-size
                         density="compact"
                       />
                       <div class="text-caption text-grey mt-1">
                         Поддерживаемые форматы: JPG, PNG, GIF. Максимальный размер: 5MB.
                       </div>
                     </VCol>
                   </VRow>
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
                    v-model="newPassword"
                    label="Новый пароль"
                    placeholder="Введите новый пароль"
                    :type="isNewPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isNewPasswordVisible ? 'bx-hide' : 'bx-show'"
                    @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="confirmPassword"
                    label="Подтверждение пароля"
                    placeholder="Подтвердите пароль"
                    :type="isConfirmPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isConfirmPasswordVisible ? 'bx-hide' : 'bx-show'"
                    @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  />
                </VCol>

                <VCol cols="12">
                  <VBtn
                    color="primary"
                    :loading="isSaving"
                    @click="changePassword"
                  >
                    Изменить пароль
                  </VBtn>
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
                    <th scope="col">ТИП</th>
                    <th scope="col">EMAIL</th>
                    <th scope="col">БРАУЗЕР</th>
                    <th scope="col">ПРИЛОЖЕНИЕ</th>
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
                      <VCheckbox v-model="notification.email" hide-details />
                    </td>
                    <td>
                      <VCheckbox v-model="notification.browser" hide-details />
                    </td>
                    <td>
                      <VCheckbox v-model="notification.app" hide-details />
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

        <!-- Вкладка: Активность -->
        <VWindowItem>
          <VCard title="Активность агента">
            <VCardText>
              <AgentActivityTimeline :agent-id="agentId || 0" />
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
