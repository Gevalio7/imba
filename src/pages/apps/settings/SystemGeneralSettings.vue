<script setup lang="ts">
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue'
import { reactive, ref } from 'vue'

type PrivacyMode = 'Приватные' | 'Публичные'

const timezones = [
  '(GMT+03:00) Москва',
  '(GMT+02:00) Калининград',
  '(GMT+04:00) Самара',
  '(GMT+05:00) Екатеринбург',
]

const privacyModes: PrivacyMode[] = ['Приватные', 'Публичные']

const languages = ['Русский', 'English']

const passwordComplexities = ['Низкая', 'Средняя', 'Высокая']

const systemSettings = reactive({
  timezone: '(GMT+03:00) Москва',

  defaultFiles: 'Приватные' as PrivacyMode,
  defaultRequestComments: 'Приватные' as PrivacyMode,
  defaultStatusChangeComments: 'Публичные' as PrivacyMode,
  commentTimeoutMinutes: 0,

  personalDataConsentLink: '',
  language: 'Русский',

  minPasswordLength: 8,
  passwordComplexity: null as null | string,

  changePasswordOnFirstLogin: false,
  twoFactorForEmployees: false,
})

const features = reactive({
  clients: true,
  priceList: true,
  contracts: true,
  serviceObjects: true,
  equipment: true,
  benchmarking: false,
  knowledgeBase: true,
})

const branding = reactive({
  title: '',
  primaryColor: '#7367F0',
  favicon: null as File | File[] | null,
  loginLogo: null as File | File[] | null,
})

const organization = reactive({
  fullName: '',
  shortName: '',
  inn: '',
  kpp: '',
  ogrn: '',
  legalAddress: '',
  actualAddress: '',
  phone: '',
  ceoPosition: '',
  ceoName: '',
  accountantName: '',
  bankName: '',
  bankBik: '',
  bankCorrAccount: '',
  bankSettlementAccount: '',
})

const isDeleteDemoDataDialogVisible = ref(false)
const isSavedSnackbarVisible = ref(false)
const isToastVisible = ref(false)
const toastMessage = ref('')

const showToast = (message: string) => {
  toastMessage.value = message
  isToastVisible.value = true
}

const onSave = () => {
  // TODO: Заменить на сохранение через API
  // eslint-disable-next-line no-console
  console.log('System settings save payload', {
    systemSettings: { ...systemSettings },
    features: { ...features },
    branding: { ...branding },
    organization: { ...organization },
  })
  isSavedSnackbarVisible.value = true
}

const onSystemSettingChange = () => {
  showToast('Настройки системы сохранены')
}

const onFeatureToggle = () => {
  showToast('Функция обновлена')
}

const onTimezoneChange = () => {
  showToast('Часовой пояс изменен')
}

const onDefaultFilesChange = () => {
  showToast('Файлы по умолчанию изменены')
}

const onDefaultRequestCommentsChange = () => {
  showToast('Комментарии по умолчанию (на карточке заявки) изменены')
}

const onDefaultStatusChangeCommentsChange = () => {
  showToast('Комментарии по умолчанию (при смене статуса) изменены')
}

const onLanguageChange = () => {
  showToast('Язык системы изменен')
}

const onPasswordComplexityChange = () => {
  showToast('Сложность пароля изменена')
}

const onDeleteDemoDataConfirm = (confirmed: boolean) => {
  if (!confirmed)
    return

  // TODO: Заменить на API вызов удаления демо данных
  // eslint-disable-next-line no-console
  console.warn('Deleting demo data...')
}
</script>

<template>
  <div>
    <!-- Общие настройки системы -->
    <VCard
      class="mb-6"
      title="Общие настройки системы"
      subtitle="Базовые параметры поведения системы по умолчанию"
    >
      <VCardText>
        <VRow>
          <VCol cols="12">
            <AppSelect
              v-model="systemSettings.timezone"
              label="Часовой пояс"
              :items="timezones"
              placeholder="(GMT+03:00) Москва"
              @change="onTimezoneChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-model="systemSettings.defaultFiles"
              label="Файлы по умолчанию"
              :items="privacyModes"
              placeholder="Приватные"
              @change="onDefaultFilesChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-model="systemSettings.defaultRequestComments"
              label="Комментарии по умолчанию (на карточке заявки)"
              :items="privacyModes"
              placeholder="Приватные"
              @change="onDefaultRequestCommentsChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-model="systemSettings.defaultStatusChangeComments"
              label="Комментарии по умолчанию (при смене статуса)"
              :items="privacyModes"
              placeholder="Публичные"
              @change="onDefaultStatusChangeCommentsChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="systemSettings.commentTimeoutMinutes"
              type="number"
              min="0"
              label="Тайм-аут на добавление комментария (мин)"
              placeholder="0"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="systemSettings.personalDataConsentLink"
              label="Ссылка на согласие на обработку персональных данных"
              placeholder="https://..."
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-model="systemSettings.language"
              label="Язык системы"
              :items="languages"
              placeholder="Русский"
              @change="onLanguageChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="systemSettings.minPasswordLength"
              type="number"
              min="4"
              label="Минимальная длина пароля"
              placeholder="8"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-model="systemSettings.passwordComplexity"
              label="Сложность пароля"
              :items="passwordComplexities"
              placeholder="Не указано"
              clearable
              @change="onPasswordComplexityChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <div class="d-flex flex-column gap-2">
              <VSwitch
                v-model="systemSettings.changePasswordOnFirstLogin"
                label="Изменять пароль при первом входе"
                inset
                @change="onSystemSettingChange"
              />
              <VSwitch
                v-model="systemSettings.twoFactorForEmployees"
                label="Двухфакторная аутентификация для сотрудников"
                inset
                @change="onSystemSettingChange"
              />
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Активация функций системы -->
    <VCard
      class="mb-6"
      title="Активация функций системы"
      subtitle="Если модуль не используется — отключите его, и он исчезнет из интерфейса"
    >
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSwitch v-model="features.clients" label="Клиенты" inset @change="onFeatureToggle" />
            <VSwitch v-model="features.priceList" label="Прайс-лист" inset @change="onFeatureToggle" />
            <VSwitch v-model="features.contracts" label="Учет договоров и сервисных периодов" inset @change="onFeatureToggle" />
            <VSwitch v-model="features.serviceObjects" label="Учет объектов обслуживания" inset @change="onFeatureToggle" />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VSwitch v-model="features.equipment" label="Оборудование" inset @change="onFeatureToggle" />
            <VSwitch v-model="features.benchmarking" label="Бенчмаркинг" inset @change="onFeatureToggle" />
            <VSwitch v-model="features.knowledgeBase" label="База знаний" inset @change="onFeatureToggle" />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Стилизация интерфейса -->
    <VCard
      class="mb-6"
      title="Стилизация интерфейса"
      subtitle="Задайте заголовок, favicon, логотип и основной цвет под фирменный стиль"
    >
      <VCardText>
        <VAlert
          class="mb-4"
          variant="tonal"
          color="info"
        >
          Для логотипа рекомендуется PNG с прозрачным фоном, до 400×50px и размером не более 50 Мб.
        </VAlert>

        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="branding.title"
              label="Title страниц системы"
              placeholder="Не указано"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="branding.primaryColor"
              label="Основной цвет системы"
              placeholder="#7367F0"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppFileInput
              v-model="branding.favicon"
              label="Favicon системы"
              placeholder="Не указано"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppFileInput
              v-model="branding.loginLogo"
              label="Логотип на странице логина"
              placeholder="Не указано"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Парковка домена -->
    <VCard
      class="mb-6"
      title="Парковка домена"
    >
      <VCardText>
        <VAlert
          color="warning"
          variant="tonal"
          icon="bx-envelope"
        >
          Если вы хотите, чтобы аккаунт был доступен по адресу в вашем домене (например, help.ваш-сайт.ru),
          напишите нам на <strong>help@okdesk.ru</strong>. В письме укажите адрес паркуемого домена.
          Опция доступна на тарифе «Эксперт».
        </VAlert>
      </VCardText>
    </VCard>

    <!-- Реквизиты организации -->
    <VCard
      class="mb-6"
      title="Реквизиты организации"
      subtitle="Заполняются один раз и используются при формировании счетов/документов"
    >
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.fullName" label="Полное наименование" placeholder="Не указано" />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.shortName" label="Сокращенное наименование" placeholder="Не указано" />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.inn" label="ИНН" placeholder="Не указано" />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.kpp" label="КПП" placeholder="Не указано" />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.ogrn" label="ОГРН" placeholder="Не указано" />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.phone" label="Телефон" placeholder="Не указано" />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextarea v-model="organization.legalAddress" label="Юридический адрес" placeholder="Не указано" />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextarea v-model="organization.actualAddress" label="Фактический адрес" placeholder="Не указано" />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.ceoPosition" label="Руководитель (должность)" placeholder="Не указано" />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.ceoName" label="Руководитель (Фамилия И. О.)" placeholder="Не указано" />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.accountantName" label="Главный бухгалтер (Фамилия И. О.)" placeholder="Не указано" />
          </VCol>

          <VCol cols="12">
            <VDivider class="my-2" />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.bankName" label="Наименование Банка" placeholder="Не указано" />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.bankBik" label="БИК Банка" placeholder="Не указано" />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.bankCorrAccount" label="Корр. счет" placeholder="Не указано" />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField v-model="organization.bankSettlementAccount" label="Расчетный счет" placeholder="Не указано" />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Удалить демо данные -->
    <VCard
      class="mb-6"
      title="Демо данные"
      subtitle="Опасное действие: удалит демо сущности и очистит тестовые записи"
    >
      <VCardText class="d-flex flex-wrap align-center justify-space-between gap-4">
        <div class="text-body-2">
          Используйте только если демо данные больше не нужны.
        </div>
        <VBtn
          color="error"
          variant="tonal"
          @click="isDeleteDemoDataDialogVisible = true"
        >
          Удалить демо данные
        </VBtn>
      </VCardText>
    </VCard>

    <div class="d-flex justify-end gap-x-4">
      <VBtn
        color="secondary"
        variant="tonal"
      >
        Отмена
      </VBtn>
      <VBtn
        color="primary"
        @click="onSave"
      >
        Сохранить изменения
      </VBtn>
    </div>
  </div>

  <ConfirmDialog
    :is-dialog-visible="isDeleteDemoDataDialogVisible"
    confirmation-question="Удалить демо данные?"
    confirm-title="Готово"
    confirm-msg="Демо данные поставлены в очередь на удаление."
    cancel-title="Отменено"
    cancel-msg="Удаление демо данных отменено."
    @update:is-dialog-visible="val => (isDeleteDemoDataDialogVisible = val)"
    @confirm="onDeleteDemoDataConfirm"
  />

  <VSnackbar
    v-model="isSavedSnackbarVisible"
    color="success"
    timeout="2000"
  >
    Настройки сохранены
  </VSnackbar>

  <VSnackbar
    v-model="isToastVisible"
    color="info"
    timeout="2000"
  >
    {{ toastMessage }}
  </VSnackbar>
</template>

