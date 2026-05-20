<script setup lang="ts">
import { onMounted } from 'vue'
import type { I18nLanguage } from '@layouts/types'

interface Props {
  languages: I18nLanguage[]
  location?: any
}

const props = withDefaults(defineProps<Props>(), {
  location: 'bottom end',
})

let locale: any = null

onMounted(() => {
  const { locale: localeRef } = useI18n({ useScope: 'global' })

  locale = localeRef
})
</script>

<template>
  <IconBtn>
    <VIcon
      size="22"
      icon="mdi-translate"
    />

    <!-- Menu -->
    <VMenu
      v-if="locale"
      activator="parent"
      :location="props.location"
      offset="21px"
      width="175"
    >
      <!-- List -->
      <VList
        :selected="[locale]"
        color="primary"
      >
        <!-- List item -->
        <VListItem
          v-for="lang in props.languages"
          :key="lang.i18nLang"
          :value="lang.i18nLang"
          @click="locale = lang.i18nLang"
        >
          <!-- Language label -->
          <VListItemTitle>
            {{ lang.label }}
          </VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </IconBtn>
</template>
