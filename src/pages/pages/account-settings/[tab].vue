<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'

// Получаем параметр tab из URL
const route = useRoute()
const activeTab = ref(route.params.tab as string || 'account')

// Формы
const accountForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

const securityForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const notificationForm = reactive({
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
})

// Состояния загрузки
const savingAccount = ref(false)
const changingPassword = ref(false)
const savingNotifications = ref(false)

// Toast уведомления
const { showToast } = useToast()

// Методы
const saveAccountSettings = async () => {
  savingAccount.value = true
  try {
    // TODO: Реализовать сохранение настроек аккаунта
    await new Promise(resolve => setTimeout(resolve, 1000)) // Имитация API
    showToast('Настройки аккаунта сохранены')
  }
  catch (error) {
    showToast('Ошибка сохранения настроек', 'error')
  }
  finally {
    savingAccount.value = false
  }
}

const changePassword = async () => {
  if (securityForm.newPassword !== securityForm.confirmPassword) {
    showToast('Пароли не совпадают', 'error')

    return
  }

  changingPassword.value = true
  try {
    // TODO: Реализовать смену пароля
    await new Promise(resolve => setTimeout(resolve, 1000)) // Имитация API
    showToast('Пароль успешно изменён')

    // Очистка формы
    securityForm.currentPassword = ''
    securityForm.newPassword = ''
    securityForm.confirmPassword = ''
  }
  catch (error) {
    showToast('Ошибка смены пароля', 'error')
  }
  finally {
    changingPassword.value = false
  }
}

const saveNotificationSettings = async () => {
  savingNotifications.value = true
  try {
    // TODO: Реализовать сохранение настроек уведомлений
    await new Promise(resolve => setTimeout(resolve, 1000)) // Имитация API
    showToast('Настройки уведомлений сохранены')
  }
  catch (error) {
    showToast('Ошибка сохранения настроек', 'error')
  }
  finally {
    savingNotifications.value = false
  }
}

// Имитация получения данных пользователя
const loadUserData = async () => {
  try {
    // TODO: Загрузить реальные данные пользователя
    accountForm.firstName = 'Иван'
    accountForm.lastName = 'Иванов'
    accountForm.email = 'ivan@example.com'
    accountForm.phone = '+7 (999) 123-45-67'
  }
  catch (error) {
    console.error('Error loading user data:', error)
  }
}

// Загружаем данные при монтировании
loadUserData()
</script>

<template>
  <div>
    <VCard>
      <VCardTitle class="text-h5 mb-6">
        Настройки аккаунта
      </VCardTitle>

      <VTabs
        v-model="activeTab"
        class="mb-6"
      >
        <VTab value="account">
          <VIcon start>
            bx-user
          </VIcon>
          Аккаунт
        </VTab>
        <VTab value="security">
          <VIcon start>
            bx-shield
          </VIcon>
          Безопасность
        </VTab>
        <VTab value="notifications">
          <VIcon start>
            bx-bell
          </VIcon>
          Уведомления
        </VTab>
      </VTabs>

      <VTabsWindow v-model="activeTab">
        <!-- Вкладка Аккаунт -->
        <VTabsWindowItem value="account">
          <VCardText>
            <VForm @submit.prevent="saveAccountSettings">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="accountForm.firstName"
                    label="Имя"
                    placeholder="Введите имя"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="accountForm.lastName"
                    label="Фамилия"
                    placeholder="Введите фамилию"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="accountForm.email"
                    label="Email"
                    type="email"
                    placeholder="Введите email"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="accountForm.phone"
                    label="Телефон"
                    placeholder="Введите телефон"
                  />
                </VCol>
              </VRow>

              <VBtn
                type="submit"
                color="primary"
                class="mt-6"
                :loading="savingAccount"
              >
                Сохранить изменения
              </VBtn>
            </VForm>
          </VCardText>
        </VTabsWindowItem>

        <!-- Вкладка Безопасность -->
        <VTabsWindowItem value="security">
          <VCardText>
            <VForm @submit.prevent="changePassword">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="securityForm.currentPassword"
                    label="Текущий пароль"
                    type="password"
                    placeholder="Введите текущий пароль"
                  />
                </VCol>
              </VRow>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="securityForm.newPassword"
                    label="Новый пароль"
                    type="password"
                    placeholder="Введите новый пароль"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="securityForm.confirmPassword"
                    label="Подтверждение пароля"
                    type="password"
                    placeholder="Повторите новый пароль"
                  />
                </VCol>
              </VRow>

              <VBtn
                type="submit"
                color="primary"
                class="mt-6"
                :loading="changingPassword"
              >
                Изменить пароль
              </VBtn>
            </VForm>
          </VCardText>
        </VTabsWindowItem>

        <!-- Вкладка Уведомления -->
        <VTabsWindowItem value="notifications">
          <VCardText>
            <VForm @submit.prevent="saveNotificationSettings">
              <VRow>
                <VCol cols="12">
                  <VSwitch
                    v-model="notificationForm.emailNotifications"
                    label="Email уведомления"
                    color="primary"
                  />
                </VCol>
                <VCol cols="12">
                  <VSwitch
                    v-model="notificationForm.smsNotifications"
                    label="SMS уведомления"
                    color="primary"
                  />
                </VCol>
                <VCol cols="12">
                  <VSwitch
                    v-model="notificationForm.pushNotifications"
                    label="Push уведомления"
                    color="primary"
                  />
                </VCol>
              </VRow>

              <VBtn
                type="submit"
                color="primary"
                class="mt-6"
                :loading="savingNotifications"
              >
                Сохранить настройки
              </VBtn>
            </VForm>
          </VCardText>
        </VTabsWindowItem>
      </VTabsWindow>
    </VCard>

  </div>
</template>
