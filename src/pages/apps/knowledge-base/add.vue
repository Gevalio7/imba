<script setup lang="ts">
import { $api } from '@/utils/api'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

definePage({
  meta: {
    navActiveLink: 'apps-knowledge-base',
  },
})

const router = useRouter()

// Справочники
const types = ref<any[]>([])
const services = ref<any[]>([])

// Форма
const saving = ref(false)
const loading = ref(false)

const article = ref({
  title: '',
  content: '',
  categoryId: undefined as number | undefined,
  tags: [] as string[],
  serviceId: undefined as number | undefined,
  isPublished: false,
  isActive: true,
})

// Теги
const tagInput = ref('')

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !article.value.tags.includes(tag)) {
    article.value.tags.push(tag)
  }
  tagInput.value = ''
}

const removeTag = (index: number) => {
  article.value.tags.splice(index, 1)
}

// Загрузка справочников
const fetchTypes = async () => {
  try {
    const data = await $api(`/types`)
    types.value = (data as any).types || []
  } catch (err) {
    console.error('Error fetching types:', err)
  }
}

const fetchServices = async () => {
  try {
    const data = await $api(`/services`)
    services.value = (data as any).services || []
  } catch (err) {
    console.error('Error fetching services:', err)
  }
}

// Сохранение
const save = async () => {
  if (!article.value.title?.trim()) {
    showToast('Заголовок обязателен для заполнения', 'error')
    return
  }

  if (!article.value.content?.trim()) {
    showToast('Содержание обязательно для заполнения', 'error')
    return
  }

  try {
    saving.value = true
    
    const articleData = {
      ...article.value,
      tags: article.value.tags.length > 0 ? article.value.tags : null,
    }
    
    await $api(`/knowledge-base`, {
      method: 'POST',
      body: articleData,
    })
    showToast('Статья успешно создана')
    
    router.push('/apps/knowledge-base')
  } catch (err) {
    console.error('Error saving article:', err)
    showToast('Ошибка сохранения статьи', 'error')
  } finally {
    saving.value = false
  }
}

// Отмена
const cancel = () => {
  router.push('/apps/knowledge-base')
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

// Инициализация
onMounted(async () => {
  await Promise.all([
    fetchTypes(),
    fetchServices(),
  ])
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Создание статьи
        </h4>
        <div class="text-body-1">
          Заполните информацию для создания новой статьи
        </div>
      </div>

      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="cancel"
        >
          Отмена
        </VBtn>
        <VBtn
          :loading="saving"
          @click="save"
        >
          Создать
        </VBtn>
      </div>
    </div>

    <VRow>
      <!-- Левая колонка - Основная информация -->
      <VCol
        cols="12"
        md="8"
      >
        <!-- Основная информация -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Основная информация
            </h5>
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="article.title"
                  label="Заголовок *"
                  placeholder="Введите заголовок статьи"
                />
              </VCol>

              <VCol cols="12">
                <label class="v-label text-body-1 d-block mb-2">Содержание *</label>
                <TiptapEditor
                  v-model="article.content"
                  placeholder="Введите содержание статьи"
                  class="border rounded"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Правая колонка - Свойства -->
      <VCol
        cols="12"
        md="4"
      >
        <!-- Свойства -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Свойства
            </h5>
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column gap-y-4">
              <AppSelect
                v-model="article.categoryId"
                :items="types"
                item-title="name"
                item-value="id"
                label="Категория"
                placeholder="Выберите категорию"
                clearable
              />

              <AppSelect
                v-model="article.serviceId"
                :items="services"
                item-title="name"
                item-value="id"
                label="Сервис"
                placeholder="Выберите сервис"
                clearable
              />

              <!-- Теги -->
              <div>
                <AppTextField
                  v-model="tagInput"
                  label="Теги"
                  placeholder="Введите тег и нажмите Enter"
                  @keydown.enter.prevent="addTag"
                />
                <div class="d-flex flex-wrap gap-1 mt-2">
                  <VChip
                    v-for="(tag, index) in article.tags"
                    :key="index"
                    closable
                    size="small"
                    color="secondary"
                    @click:close="removeTag(index)"
                  >
                    {{ tag }}
                  </VChip>
                </div>
              </div>

              <VDivider class="my-2" />

              <div class="d-flex align-center justify-space-between">
                <span>Опубликовано</span>
                <VSwitch
                  v-model="article.isPublished"
                  color="success"
                  density="compact"
                  hide-details
                />
              </div>

              <div class="d-flex align-center justify-space-between">
                <span>Активно</span>
                <VSwitch
                  v-model="article.isActive"
                  color="primary"
                  density="compact"
                  hide-details
                />
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Snackbar -->
    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>

<style lang="scss">
.ProseMirror {
  p {
    margin-block-end: 0;
  }

  padding: 0.5rem;
  min-block-size: 150px;
  outline: none;

  p.is-editor-empty:first-child::before {
    block-size: 0;
    color: #adb5bd;
    content: attr(data-placeholder);
    float: inline-start;
    pointer-events: none;
  }
}
</style>
