<script setup lang="ts">
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useLogout } from '@/composables/useLogout'

const { showToast, isToastVisible, toastMessage, toastColor } = useToast()
const { logout } = useLogout()

const router = useRouter()

const getStoredUserData = () => {
  if (typeof sessionStorage === 'undefined')
    return null
  try {
    const data = sessionStorage.getItem('userData')

    return data ? JSON.parse(data) : null
  }
  catch (error: any) {
    console.error('Failed to parse userData:', (error as any)?.message || error)

    return null
  }
}

const userData = ref(getStoredUserData())

onMounted(() => {
  userData.value = getStoredUserData()
})

const userProfileList = [
  { type: 'divider' },
  {
    type: 'navItem',
    icon: 'bx-user',
    title: 'Profile',
    to: userData.value?.type === 'agent' ? `/apps/Agents/edit?id=${userData.value.id}` : { name: 'pages-account-settings-tab', params: { tab: 'account' } },
  },
  { type: 'divider' },
] as any[]
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

  <VSnackbar
    v-model="isToastVisible"
    :color="toastColor"
    timeout="1200"
  >
    {{ toastMessage }}
  </VSnackbar>
</template>
