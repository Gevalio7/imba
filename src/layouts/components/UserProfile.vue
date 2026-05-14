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

// UI state for logout notifications
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref<'success'|'error'>('success')

const showToast = (message: string, color: 'success'|'error' = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

const logout = async () => {
  // Логирование состояния перед logout
  try {
    console.info('Logout: start, sessionStorage keys:', typeof sessionStorage !== 'undefined' ? Object.keys(sessionStorage) : 'no sessionStorage')
    console.info('Logout: cookies before clear:', typeof document !== 'undefined' ? document.cookie : 'no document')
  } catch (e) {
    console.warn('Logout: error reading storages', e)
  }

  // Попытка завершить сессию на сервере и проверка ответа
  let serverTerminated = false
  try {
    const userData = getStoredUserData()
    if (userData) {
      const res = await $api<{ message?: string }>('/sessionManagement/terminate-current', { method: 'POST' })
      if (res && (res.message && /terminate/i.test(res.message) || res.message === 'Session terminated successfully')) {
        serverTerminated = true
        showToast('Сессия завершена на сервере', 'success')
      } else {
        console.warn('terminate-current returned unexpected response:', res)
        showToast('Не удалось завершить сессию на сервере', 'error')
      }
    }
  } catch (error: any) {
    console.error('Ошибка при завершении сессии на сервере:', error)
    const errMsg = error?.data?.message || error?.message || 'Серверная ошибка'
    showToast(`Ошибка завершения сессии: ${errMsg}`, 'error')
  }

  // Очищаем client-side хранилища
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('userAbilityRules')
      sessionStorage.removeItem('userData')
      sessionStorage.removeItem('accessToken')
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('userAbilityRules')
    }
  } catch (e) {
    console.warn('Ошибка при очистке session/local storage:', e)
  }

  // Утилита для удаления cookie (несколько вариантов домена/path)
  const eraseCookie = (name: string) => {
    try {
      const expire = 'Thu, 01 Jan 1970 00:00:00 GMT'
      const path = 'path=/;'
      // Простая очистка
      document.cookie = `${name}=; ${path} expires=${expire}`
      // Попробуем с доменом (текущий и с leading dot)
      try {
        const hostname = location.hostname
        document.cookie = `${name}=; Domain=${hostname}; ${path} expires=${expire}`
        document.cookie = `${name}=; Domain=.${hostname}; ${path} expires=${expire}`
      } catch (dErr) {
        // ignore
      }
    } catch (err) {
      // ignore
    }
  }

  // Очищаем cookie, сначала через useCookie (если доступен), затем через document.cookie
  try {
    const cookieUserData = useCookie('userData')
    const cookieAccessToken = useCookie('accessToken')
    cookieUserData.value = null
    cookieAccessToken.value = null
  } catch (cookieError) {
    console.warn('useCookie недоступен или ошибка при очистке cookie:', cookieError)
  }

  try {
    if (typeof document !== 'undefined') {
      // Выявляем все cookie и удаляем те, которые связаны с аутентификацией
      const namesToRemove = ['userData', 'accessToken', 'userAbilityRules']
      // Также удаляем все, найденные в document.cookie
      const allCookies = document.cookie ? document.cookie.split(';').map(c => c.split('=')[0].trim()) : []
      const uniqueNames = Array.from(new Set([...namesToRemove, ...allCookies]))
      uniqueNames.forEach(n => eraseCookie(n))
      console.info('Logout: cookies after clear attempt:', document.cookie)
    }
  } catch (e) {
    console.warn('Ошибка при попытке очистить cookie через document.cookie:', e)
  }

  // Сбрасываем ability
  try {
    ability.update([])
  } catch (e) {
    console.warn('Ошибка при сбросе ability:', e)
  }

  // Показать пользователю результат (даём пользователю увидеть сообщение) и затем перейти на login
  try {
    // Даем время увидеть snackbar (если показан), но не более 1.2 секунды
    await new Promise(resolve => setTimeout(resolve, 1200))
    // Жёсткий переход на страницу логина (принудительная перезагрузка страницы)
    window.location.replace('/login')
  } catch (err) {
    // Фолбэк
    window.location.href = '/login'
  }
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
