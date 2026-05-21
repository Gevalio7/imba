<!-- ❗Errors in the form are set on line 60 -->
<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm'
import authV2LoginIllustration from '@images/pages/auth-v2-login-illustration.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useUserPermissions } from '@/composables/useUserPermissions'
import { getFirstAccessibleRoutePath } from '@/utils/firstAccessibleRoute'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const isPasswordVisible = ref(false)

const route = useRoute()
const router = useRouter()

const ability = useAbility()

const { loadPermissions } = useUserPermissions()

const errors = ref<Record<string, string | undefined>>({
  email: undefined,
  password: undefined,
})

const refVForm = ref<VForm>()

const credentials = ref({
  email: 'admin@example.com',
  password: 'admin123',
})

const rememberMe = ref(false)

const login = async () => {
  try {
    const res = await $api('/auth/login', {
      method: 'POST',
      body: {
        login: credentials.value.email,
        email: credentials.value.email,
        password: credentials.value.password,
      },
      onResponseError({ response }) {
        errors.value = response._data?.errors || {}
        if (response._data?.message)
          errors.value.general = response._data.message
      },
    })

    const { accessToken, userData, userAbilityRules } = res

    console.log('Login response:', { accessToken, userData, userAbilityRulesCount: userAbilityRules?.length })

    // Сохраняем в sessionStorage + localStorage (fallback для новых вкладок)
    if (typeof sessionStorage !== 'undefined') {
      const rulesJson = JSON.stringify(userAbilityRules)

      sessionStorage.setItem('userAbilityRules', rulesJson)
      sessionStorage.setItem('userData', JSON.stringify(userData))
      sessionStorage.setItem('accessToken', accessToken)

      localStorage.setItem('userAbilityRules', rulesJson)

      console.log('Saved to storage. userAbilityRules count:', userAbilityRules.length)
    }

    // Сохраняем userData и accessToken в cookie (guards.ts проверяет наличие через useCookie)
    // НЕ пишем userAbilityRules в cookie — лимит 4KB, а rules > 7KB.
    // CASL инициализируется из sessionStorage (см. plugins/casl/index.ts).
    const cookieUserData = useCookie<typeof userData>('userData')
    const cookieAccessToken = useCookie<string>('accessToken')

    cookieUserData.value = userData
    cookieAccessToken.value = accessToken

    ability.update(userAbilityRules)

    // Загружаем права
    loadPermissions()

    // Куда редиректить:
    // 1) Если в URL есть ?to=... — туда (вернёт на исходную страницу)
    // 2) Иначе — на первый доступный пункт меню (по userAbilityRules)
    // 3) Фолбэк — /dashboards/analytics
    const targetPath = route.query.to
      ? String(route.query.to)
      : getFirstAccessibleRoutePath(userAbilityRules || [])

    window.location.href = targetPath
  }
  catch (err) {
    console.error(err)
  }
}

const onSubmit = () => {
  refVForm.value?.validate()
    .then(({ valid: isValid }) => {
      if (isValid)
        login()
    })
}
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-2">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </RouterLink>

  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 pa-8">
        <div class="d-flex align-center justify-center w-100 h-100">
          <VImg
            max-width="700"
            :src="authV2LoginIllustration"
            class="auth-illustration"
          />
        </div>
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-6"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to <span class="text-capitalize"> {{ themeConfig.app.title }} </span>! 👋🏻
          </h4>
          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>
        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.email"
                  label="Email / Логин"
                  placeholder="admin или admin@example.com"
                  type="text"
                  autofocus
                  :rules="[requiredValidator]"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.password"
                  label="Password"
                  placeholder="············"
                  :rules="[requiredValidator]"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :error-messages="errors.password"
                  :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center flex-wrap justify-space-between my-6">
                  <VCheckbox
                    v-model="rememberMe"
                    label="Remember me"
                  />
                  <RouterLink
                    class="text-primary"
                    :to="{ name: 'forgot-password' }"
                  >
                    Forgot Password?
                  </RouterLink>
                </div>

                <VAlert
                  v-if="errors.general"
                  type="error"
                  class="mb-4"
                >
                  {{ errors.general }}
                </VAlert>

                <VBtn
                  block
                  type="submit"
                >
                  Login
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
