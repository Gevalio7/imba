<script setup lang="ts">
import { $api } from '@/utils/api'
import { computed, onMounted, ref } from 'vue'

// Типы данных
interface Article {
  id: number
  title: string
  content: string
  categoryId: number | null
  categoryName: string | null
  tags: string[] | null
  serviceId: number | null
  serviceName: string | null
  isPublished: boolean
  viewsCount: number
  createdBy: number | null
  createdByLogin: string | null
  createdByFirstname: string | null
  createdByLastname: string | null
  createdAt: string
  updatedAt: string
  isActive: boolean
}

// Images
import kbIllustration1 from '@images/pages/academy-course-illustration1.png'
import kbIllustration2Dark from '@images/pages/academy-course-illustration2-dark.png'
import kbIllustration2Light from '@images/pages/academy-course-illustration2-light.png'

const kbIllustration2 = useGenerateImageVariant(kbIllustration2Light, kbIllustration2Dark)

const router = useRouter()

// Данные
const articles = ref<Article[]>([])
const categoriesList = ref<any[]>([])
const servicesList = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Поиск
const searchQuery = ref('')

// Диалоги
const categoryDialog = ref(false)
const serviceDialog = ref(false)
const newCategory = ref({ name: '', comment: '' })
const newService = ref({ name: '' })

// Загрузка данных
const fetchArticles = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $api<{ articles: Article[], total: number }>('/knowledge-base')
    articles.value = data.articles
  } catch (err) {
    error.value = 'Ошибка загрузки статей'
    console.error('Error fetching articles:', err)
  } finally {
    loading.value = false
  }
}

// Загрузка категорий
const fetchCategories = async () => {
  try {
    const data = await $api<any>('/types')
    categoriesList.value = data.types || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
}

// Загрузка сервисов
const fetchServices = async () => {
  try {
    const data = await $api<any>('/services')
    servicesList.value = data.services || []
  } catch (err) {
    console.error('Error fetching services:', err)
  }
}

// Создание категории
const createCategory = async () => {
  if (!newCategory.value.name?.trim()) return
  try {
    await $api(`/types`, {
      method: 'POST',
      body: { name: newCategory.value.name, comment: newCategory.value.comment }
    })
    showToast('Категория создана')
    categoryDialog.value = false
    newCategory.value = { name: '', comment: '' }
    fetchCategories()
  } catch (err) {
    showToast('Ошибка создания категории', 'error')
  }
}

// Создание сервиса
const createService = async () => {
  if (!newService.value.name?.trim()) return
  try {
    await $api(`/services`, {
      method: 'POST',
      body: { name: newService.value.name }
    })
    showToast('Сервис создан')
    serviceDialog.value = false
    newService.value = { name: '' }
    fetchServices()
  } catch (err) {
    showToast('Ошибка создания сервиса', 'error')
  }
}

// Фильтрованные статьи
const filteredArticles = computed(() => {
  if (!searchQuery.value) return articles.value
  const q = searchQuery.value.toLowerCase()
  return articles.value.filter(a =>
    a.title?.toLowerCase().includes(q) ||
    a.content?.toLowerCase().includes(q) ||
    a.categoryName?.toLowerCase().includes(q) ||
    a.tags?.some(t => t.toLowerCase().includes(q))
  )
})

// Популярные статьи
const popularArticles = computed(() => {
  return [...articles.value]
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 4)
})

// Статистика
const stats = computed(() => ({
  total: articles.value.length,
  published: articles.value.filter(a => a.isPublished).length,
  views: articles.value.reduce((sum, a) => sum + a.viewsCount, 0),
}))

onMounted(() => {
  fetchArticles()
  fetchCategories()
  fetchServices()
})

// Удаление статьи
const deleteArticleById = async (id: number) => {
  try {
    await $api(`/knowledge-base/${id}`, { method: 'DELETE' })
    const index = articles.value.findIndex(a => a.id === id)
    if (index !== -1) articles.value.splice(index, 1)
  } catch (err) {
    console.error('Error deleting article:', err)
    throw err
  }
}

const deleteDialog = ref(false)
const deletingItem = ref<Article | null>(null)

const deleteItem = (item: Article) => {
  deletingItem.value = item
  deleteDialog.value = true
}

const deleteItemConfirm = async () => {
  if (!deletingItem.value) return
  try {
    await deleteArticleById(deletingItem.value.id)
    showToast('Статья удалена')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления', 'error')
  }
}

const closeDelete = () => {
  deleteDialog.value = false
  deletingItem.value = null
}

const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

const createArticle = () => router.push('/apps/knowledge-base/add')
const editArticle = (id: number) => router.push({ path: '/apps/knowledge-base/edit', query: { id } })
const viewArticle = (id: number) => router.push({ path: '/apps/knowledge-base/view', query: { id } })

const getAuthorName = (article: Article) => {
  if (!article.createdByFirstname && !article.createdByLastname)
    return article.createdByLogin || '-'
  return `${article.createdByFirstname || ''} ${article.createdByLastname || ''}`.trim()
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('ru-RU')

const getExcerpt = (content: string, length: number = 60) => {
  if (!content) return ''
  const text = content.replace(/<[^>]*>/g, '')
  return text.length > length ? text.slice(0, length) + '...' : text
}

const categoryColors = ['primary', 'success', 'warning', 'error', 'info', 'secondary']
const getCategoryColor = (index: number) => categoryColors[index % categoryColors.length]

const cardImages = [
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=200&fit=crop',
]

const getCardImage = (index: number) => cardImages[index % cardImages.length]
</script>

<template>
  <div>
    <!-- Hero Section с поиском -->
    <VCard class="mb-6">
      <VCardText class="py-12 position-relative">
        <div
          class="d-flex flex-column gap-y-4 mx-auto"
          :class="
            $vuetify.display.mdAndUp
              ? 'w-50'
              : $vuetify.display.xs
                ? 'w-100'
                : 'w-75'
          "
        >
          <h4
            class="text-h4 text-center text-wrap mx-auto"
            :class="$vuetify.display.mdAndUp ? 'w-75' : 'w-100'"
          >
            База знаний
            <span class="text-primary text-no-wrap"> для поддержки</span>
          </h4>
          <p class="text-center text-wrap text-body-1 mx-auto mb-0">
            Найдите ответы на часто задаваемые вопросы, 
            изучите документацию и повысьте эффективность работы.
          </p>
          <div class="d-flex justify-center align-center gap-4 flex-wrap">
            <div
              class="flex-grow-1"
              style="max-inline-size: 350px"
            >
              <AppTextField
                v-model="searchQuery"
                placeholder="Поиск статей..."
              />
            </div>
            <VBtn
              color="primary"
              density="comfortable"
              icon="bx-search"
              class="rounded"
            />
          </div>
        </div>
        <img
          :src="kbIllustration1"
          class="illustration1 d-none d-md-block flip-in-rtl"
          height="180"
        >
        <img
          :src="kbIllustration2"
          class="illustration2 d-none d-md-block"
          height="124"
        >
      </VCardText>
    </VCard>

    <!-- Статистика и кнопки -->
    <VRow class="mb-6">
      <VCol cols="12" md="8">
        <VRow>
          <VCol cols="4">
            <VCard>
              <VCardText class="d-flex align-center pa-3">
                <VAvatar color="primary" variant="tonal" size="40" class="mr-3">
                  <VIcon icon="bx-file" />
                </VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">Всего статей</div>
                  <div class="text-h5">{{ stats.total }}</div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="4">
            <VCard>
              <VCardText class="d-flex align-center pa-3">
                <VAvatar color="success" variant="tonal" size="40" class="mr-3">
                  <VIcon icon="bx-check-circle" />
                </VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">Опубликовано</div>
                  <div class="text-h5">{{ stats.published }}</div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="4">
            <VCard>
              <VCardText class="d-flex align-center pa-3">
                <VAvatar color="info" variant="tonal" size="40" class="mr-3">
                  <VIcon icon="bx-show" />
                </VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">Просмотров</div>
                  <div class="text-h5">{{ stats.views }}</div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>
      <VCol cols="12" md="4">
        <div class="d-flex gap-2 h-100 align-center justify-start justify-md-end flex-wrap">
          <VBtn
            variant="tonal"
            color="secondary"
            size="small"
            prepend-icon="bx-folder-plus"
            @click="categoryDialog = true"
          >
            Категория
          </VBtn>
          <VBtn
            variant="tonal"
            color="info"
            size="small"
            prepend-icon="bx-server"
            @click="serviceDialog = true"
          >
            Сервис
          </VBtn>
          <VBtn
            color="primary"
            size="small"
            prepend-icon="bx-plus"
            @click="createArticle"
          >
            Новая статья
          </VBtn>
        </div>
      </VCol>
    </VRow>

    <!-- Основной контент -->
    <VRow>
      <!-- Список статей -->
      <VCol cols="12" md="8">
        <!-- Популярные статьи с картинками -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center py-3 px-4">
            <VIcon icon="bx-star" color="warning" class="mr-2" />
            Популярные статьи
          </VCardTitle>
          <VCardText class="pa-0">
            <div v-if="loading" class="d-flex justify-center pa-6">
              <VProgressCircular indeterminate color="primary" />
            </div>
            
            <div v-else-if="error" class="pa-4">
              <VAlert type="error">{{ error }}</VAlert>
            </div>
            
            <VRow v-else-if="popularArticles.length" class="ma-0">
              <VCol
                v-for="(article, index) in popularArticles"
                :key="article.id"
                cols="12"
                sm="6"
              >
                <VCard flat border class="h-100">
                  <VImg
                    :src="getCardImage(index)"
                    height="120"
                    cover
                    class="cursor-pointer"
                    @click="viewArticle(article.id)"
                  />
                  <VCardText class="pb-2">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <VChip
                        v-if="article.categoryName"
                        size="x-small"
                        :color="getCategoryColor(index)"
                        variant="tonal"
                      >
                        {{ article.categoryName }}
                      </VChip>
                      <div class="d-flex align-center text-caption text-medium-emphasis">
                        <VIcon icon="bx-show" size="14" class="mr-1" />
                        {{ article.viewsCount }}
                      </div>
                    </div>
                    
                    <h6 
                      class="text-subtitle-1 font-weight-bold mb-1 cursor-pointer text-primary"
                      @click="viewArticle(article.id)"
                    >
                      {{ article.title }}
                    </h6>
                    
                    <p class="text-caption text-medium-emphasis mb-2">
                      {{ getExcerpt(article.content, 60) }}
                    </p>
                    
                    <div class="d-flex justify-space-between align-center">
                      <span class="text-caption">{{ formatDate(article.updatedAt) }}</span>
                      <div class="d-flex gap-1">
                        <IconBtn size="x-small" @click="editArticle(article.id)">
                          <VIcon icon="bx-edit" size="16" />
                        </IconBtn>
                        <IconBtn size="x-small" color="error" @click="deleteItem(article)">
                          <VIcon icon="bx-trash" size="16" />
                        </IconBtn>
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
            
            <div v-else class="text-center pa-6">
              <VIcon icon="bx-file" size="48" color="grey" />
              <p class="mt-2">Нет статей</p>
            </div>
          </VCardText>
        </VCard>

        <!-- Все статьи -->
        <VCard>
          <VCardTitle class="d-flex align-center py-3 px-4">
            <VIcon icon="bx-list-ul" class="mr-2" />
            Все статьи
            <VSpacer />
            <span class="text-body-2 text-medium-emphasis">{{ filteredArticles.length }}</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-0">
            <VList v-if="filteredArticles.length" lines="three">
              <template v-for="(article, index) in filteredArticles" :key="article.id">
                <VListItem class="py-3">
                  <template #prepend>
                    <VAvatar
                      :color="getCategoryColor(index)"
                      variant="tonal"
                      size="40"
                    >
                      <VIcon icon="bx-file" />
                    </VAvatar>
                  </template>
                  
                  <VListItemTitle class="font-weight-medium">
                    <span 
                      class="cursor-pointer text-primary"
                      @click="viewArticle(article.id)"
                    >
                      {{ article.title }}
                    </span>
                  </VListItemTitle>
                  
                  <VListItemSubtitle class="mt-1">
                    <div class="d-flex flex-wrap gap-1 align-center">
                      <VChip
                        v-if="article.categoryName"
                        size="x-small"
                        variant="tonal"
                        :color="getCategoryColor(index)"
                      >
                        {{ article.categoryName }}
                      </VChip>
                      <VChip
                        v-if="article.serviceName"
                        size="x-small"
                        variant="tonal"
                        color="info"
                      >
                        {{ article.serviceName }}
                      </VChip>
                      <VChip
                        :color="article.isPublished ? 'success' : 'warning'"
                        size="x-small"
                        label
                      >
                        {{ article.isPublished ? 'Опубликовано' : 'Черновик' }}
                      </VChip>
                    </div>
                  </VListItemSubtitle>
                  
                  <template #append>
                    <div class="d-flex flex-column align-center">
                      <div class="text-caption text-medium-emphasis mb-1">
                        <VIcon icon="bx-show" size="14" class="mr-1" />
                        {{ article.viewsCount }}
                      </div>
                      <div class="d-flex gap-1">
                        <IconBtn size="small" @click="editArticle(article.id)">
                          <VIcon icon="bx-edit" size="18" />
                        </IconBtn>
                        <IconBtn size="small" color="error" @click="deleteItem(article)">
                          <VIcon icon="bx-trash" size="18" />
                        </IconBtn>
                      </div>
                    </div>
                  </template>
                </VListItem>
                <VDivider v-if="index < filteredArticles.length - 1" />
              </template>
            </VList>
            
            <div v-else class="text-center pa-6">
              <VIcon icon="bx-search" size="48" color="grey" />
              <p class="mt-2">Статьи не найдены</p>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Боковая панель -->
      <VCol cols="12" md="4">
        <!-- Категории -->
        <VCard class="mb-4">
          <VCardTitle class="d-flex align-center py-3 px-4">
            <VIcon icon="bx-folder" class="mr-2" />
            Категории
            <VSpacer />
            <VBtn icon="bx-plus" size="x-small" variant="text" @click="categoryDialog = true" />
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-2">
            <div v-if="categoriesList.length" class="d-flex flex-column gap-1">
              <div
                v-for="cat in categoriesList.slice(0, 8)"
                :key="cat.id"
                class="pa-2 rounded cursor-pointer hover-bg"
              >
                <div class="d-flex justify-space-between align-center">
                  <div class="d-flex align-center">
                    <VIcon icon="bx-folder" size="18" class="mr-2 text-medium-emphasis" />
                    <span class="text-body-2">{{ cat.name }}</span>
                  </div>
                  <VChip size="x-small" variant="tonal">
                    {{ articles.filter(a => a.categoryId === cat.id).length }}
                  </VChip>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-medium-emphasis py-4">
              <p class="text-body-2">Нет категорий</p>
            </div>
          </VCardText>
        </VCard>

        <!-- Сервисы -->
        <VCard class="mb-4">
          <VCardTitle class="d-flex align-center py-3 px-4">
            <VIcon icon="bx-server" class="mr-2" />
            Сервисы
            <VSpacer />
            <VBtn icon="bx-plus" size="x-small" variant="text" @click="serviceDialog = true" />
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-2">
            <div v-if="servicesList.length" class="d-flex flex-column gap-1">
              <div
                v-for="srv in servicesList.slice(0, 6)"
                :key="srv.id"
                class="pa-2 rounded cursor-pointer hover-bg"
              >
                <div class="d-flex justify-space-between align-center">
                  <div class="d-flex align-center">
                    <VIcon icon="bx-server" size="18" class="mr-2 text-medium-emphasis" />
                    <span class="text-body-2">{{ srv.name }}</span>
                  </div>
                  <VChip size="x-small" variant="tonal">
                    {{ articles.filter(a => a.serviceId === srv.id).length }}
                  </VChip>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-medium-emphasis py-4">
              <p class="text-body-2">Нет сервисов</p>
            </div>
          </VCardText>
        </VCard>

        <!-- Теги -->
        <VCard>
          <VCardTitle class="py-3 px-4">
            <VIcon icon="bx-purchase-tag" class="mr-2" />
            Теги
          </VCardTitle>
          <VDivider />
          <VCardText>
            <div class="d-flex flex-wrap gap-1">
              <template v-if="articles.some(a => a.tags?.length)">
                <VChip
                  v-for="tag in [...new Set(articles.flatMap(a => a.tags || []))].slice(0, 15)"
                  :key="tag"
                  size="small"
                  variant="tonal"
                  color="secondary"
                >
                  {{ tag }}
                </VChip>
              </template>
              <span v-else class="text-body-2 text-medium-emphasis">
                Нет тегов
              </span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Диалог создания категории -->
    <VDialog v-model="categoryDialog" max-width="400">
      <VCard>
        <VCardTitle>Новая категория</VCardTitle>
        <VCardText>
          <AppTextField
            v-model="newCategory.name"
            label="Название"
            placeholder="Введите название категории"
            class="mb-3"
          />
          <AppTextField
            v-model="newCategory.comment"
            label="Описание"
            placeholder="Краткое описание"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="categoryDialog = false">Отмена</VBtn>
          <VBtn color="primary" @click="createCategory">Создать</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Диалог создания сервиса -->
    <VDialog v-model="serviceDialog" max-width="400">
      <VCard>
        <VCardTitle>Новый сервис</VCardTitle>
        <VCardText>
          <AppTextField
            v-model="newService.name"
            label="Название"
            placeholder="Введите название сервиса"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="serviceDialog = false">Отмена</VBtn>
          <VBtn color="primary" @click="createService">Создать</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Диалог удаления -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard>
        <VCardTitle>Подтверждение удаления</VCardTitle>
        <VCardText>
          Удалить статью "{{ deletingItem?.title }}"?
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="error" variant="outlined" @click="closeDelete">Отмена</VBtn>
          <VBtn color="success" @click="deleteItemConfirm">Удалить</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Уведомления -->
    <VSnackbar v-model="isToastVisible" :color="toastColor" timeout="3000">
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>

<style lang="scss">
.illustration1 {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
}

.illustration2 {
  position: absolute;
  inset-block-start: 2rem;
  inset-inline-start: 2.5rem;
}
</style>

<style lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
}

.hover-bg:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
