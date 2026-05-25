<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Template } from '@/types/template.types'
import { DEFAULT_PLACEHOLDERS } from '@/types/template.types'
import { $api } from '@/utils/api'

const props = defineProps<{
  modelValue: boolean
  template?: Template | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'saved', template: any): void
  (e: 'deleted', id: number): void
}>()

const router = useRouter()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const form = ref<Partial<Template>>({
  name: '',
  message: '',
  subject: '',
  cssStyles: '',
  isActive: true,
})

const activeTab = ref<'editor' | 'preview' | 'css'>('editor')
const saving = ref(false)
const testing = ref(false)
const error = ref('')

// Для красивого подтверждения удаления
const showDeleteConfirm = ref(false)

const placeholders = DEFAULT_PLACEHOLDERS

// Загрузка данных при открытии
watch(() => props.template, (t) => {
  if (t) {
    form.value = {
      ...t,
      cssStyles: t.cssStyles || '',
    }
  } else {
    resetForm()
  }
  error.value = ''
}, { immediate: true })

function resetForm() {
  form.value = {
    name: '',
    message: '<div class="container"><h2>Здравствуйте, {{user.name}}!</h2><p>Ваше обращение #{{ticket.number}} создано.</p></div>',
    subject: 'Обращение #{{ticket.number}} открыто',
    cssStyles: '.container { max-width: 600px; margin: 0 auto; font-family: Arial; }',
    isActive: true,
  }
}

function copyPlaceholder(key: string) {
  navigator.clipboard.writeText(key).then(() => {
    // Можно показать тост, но без внешних зависимостей просто alert для простоты
    console.log('Скопировано:', key)
  })
}

const previewHtml = computed(() => {
  let html = form.value.message || ''
  // Простая замена для превью
  html = html.replace(/\{\{ticket\.number\}\}/g, 'T-2026-042')
    .replace(/\{\{user\.name\}\}/g, 'Иван Иванов')
    .replace(/\{\{ticket\.title\}\}/g, 'Тестовое обращение')
    .replace(/\{\{date\.now\}\}/g, new Date().toLocaleDateString('ru-RU'))

  if (form.value.cssStyles) {
    return `<style>${form.value.cssStyles}</style>${html}`
  }
  return html
})

async function save() {
  if (!form.value.name?.trim()) {
    error.value = 'Название обязательно'
    return
  }

  saving.value = true
  error.value = ''

  try {
    const payload = {
      name: form.value.name,
      message: form.value.message,
      subject: form.value.subject,
      cssStyles: form.value.cssStyles,
      isActive: form.value.isActive,
    }

    let saved
    if (props.template?.id) {
      saved = await $api(`/templates/${props.template.id}`, { method: 'PUT', body: payload })
    } else {
      saved = await $api('/templates', { method: 'POST', body: payload })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (e: any) {
    error.value = e.message || 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
}

async function sendTest() {
  if (!props.template?.id && !form.value.name) {
    error.value = 'Сохраните шаблон перед тестом'
    return
  }

  testing.value = true
  try {
    // Если новый - сначала сохраним
    let id = props.template?.id
    if (!id) {
      const saved = await $api('/templates', {
        method: 'POST',
        body: {
          name: form.value.name,
          message: form.value.message,
          subject: form.value.subject,
          isActive: true,
        },
      })
      id = saved.id
    }

    await $api(`/templates/${id}/test`, {
      method: 'POST',
      body: { email: 'test@example.com' },
    })
    alert('Тестовое письмо отправлено (см. логи)')
  } catch (e) {
    error.value = 'Ошибка теста'
  } finally {
    testing.value = false
  }
}

  // Открываем красивый диалог подтверждения удаления
  function openDeleteConfirm() {
    error.value = ''
    showDeleteConfirm.value = true
  }

  // Реальное удаление (вызывается после подтверждения)
  async function confirmDelete() {
    if (!props.template?.id) return

    showDeleteConfirm.value = false

    try {
      await $api(`/templates/${props.template.id}`, { method: 'DELETE' })
      emit('deleted', props.template.id)
      isOpen.value = false
    } catch (e: any) {
      const backendMessage = e?.response?.data?.message || e?.message
      error.value = backendMessage || 'Не удалось удалить шаблон. Попробуйте позже.'
    }
  }

  // Переход к очередям (при ошибке "используется в очередях")
  function goToQueues() {
    isOpen.value = false
    router.push('/apps/queues')
  }

function close() {
  isOpen.value = false
}
</script>

<template>
  <VDialog v-model="isOpen" max-width="1100" persistent>
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Редактор шаблона: {{ form.name || 'Новый' }}</span>
        <VBtn icon="mdi-close" variant="text" density="comfortable" @click="close" />
      </VCardTitle>

      <VCardText>
        <!-- Улучшенное отображение ошибки удаления -->
        <div v-if="error" class="mb-4">
          <VAlert type="error" closable @click:close="error = ''">
            {{ error }}
          </VAlert>

          <!-- Кнопка "Перейти к очередям" при блокировке удаления -->
          <div v-if="error.includes('очеред') || error.includes('используется')" class="mt-2 d-flex justify-end">
            <VBtn
              size="small"
              variant="tonal"
              color="primary"
              @click="goToQueues"
            >
              Перейти к очередям
            </VBtn>
          </div>
        </div>

         <!-- Основные поля -->
         <VRow>
           <VCol cols="12">
             <VTextField
               v-model="form.name"
               label="Название *"
               :rules="[v => !!v || 'Обязательно']"
               required
             />
           </VCol>
           <VCol cols="12">
             <VTextField v-model="form.subject" label="Тема письма" />
           </VCol>
           <VCol cols="12" md="6">
             <VSwitch v-model="form.isActive" label="Активен" />
           </VCol>
         </VRow>

        <!-- Табы редактора (стиль как в Agents/edit) -->
        <VTabs v-model="activeTab" class="v-tabs-pill mt-4">
          <VTab value="editor">Редактор HTML</VTab>
          <VTab value="preview">Предпросмотр</VTab>
          <VTab value="css">CSS</VTab>
        </VTabs>

        <VWindow v-model="activeTab" class="mt-2">
          <!-- Редактор -->
          <VWindowItem value="editor">
            <VTextarea
              v-model="form.message"
            
              rows="14"
              auto-grow
              hint="Используйте {{placeholder}} для переменных"
            />
          </VWindowItem>

          <!-- Предпросмотр -->
          <VWindowItem value="preview">
            <div class="preview-container pa-4 border rounded" style="min-height: 300px; background: #fff; color: #000;">
              <div v-html="previewHtml" />
            </div>
            <div class="text-caption mt-2">Предпросмотр с тестовыми данными</div>
          </VWindowItem>

          <!-- CSS -->
          <VWindowItem value="css">
            <VTextarea
              v-model="form.cssStyles"

              rows="10"
              hint="Стили применяются к HTML шаблона"
            />
          </VWindowItem>
        </VWindow>

        <!-- Плейсхолдеры -->
        <div class="mt-4">
          <div class="text-subtitle-2 mb-2">📋 ДОСТУПНЫЕ ПЕРЕМЕННЫЕ (клик для копирования):</div>
          <div class="d-flex flex-wrap ga-1">
            <VChip
              v-for="ph in placeholders"
              :key="ph.key"
              size="small"
              @click="copyPlaceholder(ph.key)"
              style="cursor: pointer"
            >
              {{ ph.key }}
            </VChip>
          </div>
          <div class="text-caption mt-1">Полный список: ticket.*, user.*, status.*, comment.*, date.now, system.name (см. плейсхолдеры выше)</div>
        </div>
      </VCardText>

      <VCardActions class="pa-4">
        <VBtn
          variant="elevated"
          :loading="saving"
          @click="save"
        >
          Сохранить
        </VBtn>

        <VBtn
          variant="tonal"
          :loading="testing"
          @click="sendTest"
        >
          Отправить тест
        </VBtn>

        <VBtn
          v-if="props.template?.id"
          variant="tonal"
          color="error"
          @click="openDeleteConfirm"
        >
          Удалить
        </VBtn>

        <VSpacer />

        <VBtn variant="tonal" @click="close">Отмена</VBtn>
      </VCardActions>
    </VCard>

    <!-- Диалог подтверждения удаления (вместо confirm()) -->
    <VDialog v-model="showDeleteConfirm" max-width="420">
      <VCard>
        <VCardTitle>Удалить шаблон?</VCardTitle>
        <VCardText>
          Вы уверены, что хотите удалить шаблон <strong>{{ form.name }}</strong>?<br>
          Это действие нельзя отменить.
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="tonal" @click="showDeleteConfirm = false">Отмена</VBtn>
          <VBtn color="error" variant="elevated" @click="confirmDelete">Да, удалить</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VDialog>
</template>

<style scoped>
.preview-container {
  border: 1px solid #e0e0e0;
  max-height: 400px;
  overflow: auto;
}
</style>
