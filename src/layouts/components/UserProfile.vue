<script setup lang="ts">
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { onMounted } from 'vue'

const router = useRouter()
const ability = useAbility()

// Читаем userData из sessionStorage
const getStoredUserData = () => {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const data = sessionStorage.getItem('userData')
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to parse userData:', error)
    return null
  }
}

const userData = ref(getStoredUserData())

// Обновляем userData при загрузке компонента
onMounted(() => {
  userData.value = getStoredUserData()
})

const logout = async () => {
  try {
    // Получаем userData для идентификации сессии
    const userData = getStoredUserData()
    if (userData) {
      // Вызываем API для завершения сессии на бэкенде
      await $api('/sessionManagement/terminate-current', { method: 'POST' })
    }
  } catch (error) {
    console.error('Ошибка при завершении сессии на сервере:', error)
    // Продолжаем logout даже при ошибке API
  }

  // Задержка 10 секунд для визуального подтверждения
  console.log('Начинаем задержку перед logout...')
  await new Promise(resolve => setTimeout(resolve, 10000))
  console.log('Задержка завершена, очищаем данные...')

  // Очищаем sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('userAbilityRules')
    sessionStorage.removeItem('userData')
    sessionStorage.removeItem('accessToken')
  }

  // Очищаем localStorage (fallback для новых вкладок)
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('userAbilityRules')
  }

  // Очищаем cookie если есть
  if (typeof document !== 'undefined') {
    document.cookie = 'userData=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'userAbilityRules=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }

  // Сбрасываем ability
  ability.update([])

  // Форсированный редирект на логин
  window.location.href = '/login'
}

const userProfileList = [
  { type: 'divider' },
  {
    type: 'navItem',
    icon: 'bx-user',
    title: 'Profile',
    to: userData.value?.type === 'agent' ? `/apps/Agents/edit?id=${userData.value.id}` : { name: 'pages-account-settings-tab', params: { tab: 'account' } },
  },
  { type: 'divider' },
]
</script>

<template>
  <VBadge
    v-if="userData"
    dot
    bordered
    location="bottom right"
    offset-x="1"
    offset-y="2"
    color="success"
  >
    <VAvatar
      size="38"
      class="cursor-pointer"
      :color="!userData.avatar ? 'primary' : undefined"
      :variant="!userData.avatar ? 'tonal' : undefined"
    >
      <VImg
        v-if="userData.avatar"
        :src="userData.avatar"
      />
      <VIcon
        v-else
        icon="bx-user"
      />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="240"
        location="bottom end"
        offset="20px"
      >
        <VList>
          <VListItem>
            <div class="d-flex gap-2 align-center">
              <VListItemAction>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                  bordered
                >
                  <VAvatar
                    :color="!userData.avatar ? 'primary' : undefined"
                    :variant="!userData.avatar ? 'tonal' : undefined"
                  >
                    <VImg
                      v-if="userData.avatar"
                      :src="userData.avatar"
                    />
                    <VIcon
                      v-else
                      icon="bx-user"
                    />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
              <div>
                <VListItemTitle class="font-weight-medium">
                  {{ userData.fullName || userData.username }}
                </VListItemTitle>
                <VListItemSubtitle class="text-disabled text-capitalize">
                  {{ userData.role }}
                </VListItemSubtitle>
              </div>
            </div>
          </VListItem>

          <PerfectScrollbar :options="{ wheelPropagation: false }">
            <template
              v-for="item in userProfileList"
              :key="item.title"
            >
              <VListItem
                v-if="item.type === 'navItem'"
                :to="item.to"
              >
                <template #prepend>
                  <VIcon
                    :icon="item.icon"
                    size="22"
                  />
                </template>

                <VListItemTitle>{{ item.title }}</VListItemTitle>

                <template
                  v-if="item.badgeProps"
                  #append
                >
                  <VBadge
                    rounded
                    class="me-3"
                    v-bind="item.badgeProps"
                  />
                </template>
              </VListItem>

              <VDivider
                v-else
                class="my-1"
              />
            </template>
            <VDivider class="my-1" />
            <VListItem
              prepend-icon="bx-power-off"
              @click="logout"
            >
              Logout
            </VListItem>
          </PerfectScrollbar>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
