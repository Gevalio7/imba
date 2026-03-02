<script setup lang="ts">
import { $fetch } from 'ofetch'
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

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Роутер
const router = useRouter()

// Данные
const articles = ref<Article[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Загрузка данных
const fetchArticles = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $fetch<{ articles: Article[], total: number }>(`${API_BASE}/knowledge-base`)
    articles.value = data.articles
    total.value = data.total
  } catch (err) {
    error.value = 'Ошибка загрузки статей'
    console.error('Error fetching articles:', err)
  } finally {
    loading.value = false
  }
}

// Удаление статьи
const deleteArticleById = async (id: number) => {
  try {
    await $fetch(`${API_BASE}/knowledge-base/${id}`, { method: 'DELETE' })
    const index = articles.value.findIndex(a => a.id === id)
    if (index !== -1) articles.value.splice(index, 1)
  } catch (err) {
    console.error('Error deleting article:', err)
    throw err
  }
}

// Инициализация
onMounted(() => {
  fetchArticles()
})

const headers = [
  { title: 'Заголовок', key: 'title', sortable: true },
  { title: 'Категория', key: 'categoryName', sortable: false },
  { title: 'Теги', key: 'tags', sortable: false },
  { title: 'Сервис', key: 'serviceName', sortable: false },
  { title: 'Опубликовано', key: 'isPublished', sortable: true },
  { title: 'Просмотры', key: 'viewsCount', sortable: true },
  { title: 'Автор', key: 'createdByLogin', sortable: false },
  { title: 'Обновлено', key: 'updatedAt', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const searchQuery = ref('')

const filteredArticles = computed(() => {
  let filtered = articles.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(a =>
      a.title?.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q)
    )
  }

  return filtered
})

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Диалог удаления
const deleteDialog = ref(false)
const deletingItem = ref<Article | null>(null)

const deleteItem = (item: Article) => {
  deletingItem.value = item
  deleteDialog.value = true
}

const closeDelete = () => {
  deleteDialog.value = false
  deletingItem.value = null
}

const deleteItemConfirm = async () => {
  if (!deletingItem.value) return
  try {
    await deleteArticleById(deletingItem.value.id)
    showToast('Статья успешно удалена')
    closeDelete()
  } catch (err) {
    showToast('Ошибка удаления статьи', 'error')
  }
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

// Навигация
const createArticle = () => {
  router.push('/apps/knowledge-base/add')
}

const editArticle = (id: number) => {
  router.push({ path: '/apps/knowledge-base/edit', query: { id } })
}

const viewArticle = (id: number) => {
  router.push({ path: '/apps/knowledge-base/view', query: { id } })
}

const getAuthorName = (article: Article) => {
  if (!article.createdByFirstname && !article.createdByLastname)
    return article.createdByLogin || '-'
  return `${article.createdByFirstname || ''} ${article.createdByLastname || ''}`.trim()
}

const resolvePublishedVariant = (isPublished: boolean) => {
  return isPublished
    ? { color: 'success', text: 'Да' }
    : { color: 'warning', text: 'Нет' }
}
</script>

<template>
  <div>
    <VCard title="База знаний">

      <!-- Индикатор загрузки -->
      <div v-if="loading" class="d-flex justify-center pa-6">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Сообщение об ошибке -->
      <div v-else-if="error" class="d-flex justify-center pa-6">
        <VAlert type="error" class="ma-4">
          {{ error }}
        </VAlert>
      </div>

      <div v-else class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <AppTextField
            v-model="searchQuery"
            placeholder="Поиск статей"
            style="inline-size: 250px;"
            class="me-3"
            prepend-inner-icon="bx-search"
          />
        </div>

        <VSpacer />
        <div class="d-flex gap-4 flex-wrap align-center">
          <AppSelect
            v-model="itemsPerPage"
            :items="[5, 10, 20, 25, 50]"
          />
          <VBtn
            color="primary"
            prepend-icon="bx-plus"
            @click="createArticle"
          >
            Создать статью
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- Таблица -->
      <VDataTable
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filteredArticles"
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <!-- Заголовок статьи -->
        <template #item.title="{ item }">
          <span
            class="text-body-1 font-weight-medium text-primary cursor-pointer"
            @click="viewArticle(item.id)"
          >
            {{ item.title }}
          </span>
        </template>

        <!-- Категория -->
        <template #item.categoryName="{ item }">
          <span class="text-body-2">{{ item.categoryName || '-' }}</span>
        </template>

        <!-- Теги -->
        <template #item.tags="{ item }">
          <div v-if="item.tags && item.tags.length > 0" class="d-flex gap-1 flex-wrap">
            <VChip
              v-for="tag in item.tags.slice(0, 3)"
              :key="tag"
              size="x-small"
              color="secondary"
              variant="tonal"
            >
              {{ tag }}
            </VChip>
            <span v-if="item.tags.length > 3" class="text-caption text-medium-emphasis">
              +{{ item.tags.length - 3 }}
            </span>
          </div>
          <span v-else class="text-body-2">-</span>
        </template>

        <!-- Сервис -->
        <template #item.serviceName="{ item }">
          <span class="text-body-2">{{ item.serviceName || '-' }}</span>
        </template>

        <!-- Опубликовано -->
        <template #item.isPublished="{ item }">
          <VChip
            v-bind="resolvePublishedVariant(item.isPublished)"
            density="compact"
            label
            size="small"
          />
        </template>

        <!-- Просмотры -->
        <template #item.viewsCount="{ item }">
          <div class="d-flex align-center gap-1">
            <VIcon icon="bx-show" size="small" />
            <span class="text-body-2">{{ item.viewsCount }}</span>
          </div>
        </template>

        <!-- Автор -->
        <template #item.createdByLogin="{ item }">
          <span class="text-body-2">{{ getAuthorName(item) }}</span>
        </template>

        <!-- Обновлено -->
        <template #item.updatedAt="{ item }">
          <span class="text-body-2">{{ new Date(item.updatedAt).toLocaleDateString('ru-RU') }}</span>
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="viewArticle(item.id)">
              <VIcon icon="bx-show" />
            </IconBtn>
            <IconBtn @click="editArticle(item.id)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn @click="deleteItem(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredArticles.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог удаления -->
    <VDialog v-model="deleteDialog" max-width="500px">
      <VCard title="Вы уверены, что хотите удалить эту статью?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn color="error" variant="outlined" @click="closeDelete">Отмена</VBtn>
            <VBtn color="success" variant="elevated" @click="deleteItemConfirm">Удалить</VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Уведомления -->
    <VSnackbar v-model="isToastVisible" :color="toastColor" timeout="3000">
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
