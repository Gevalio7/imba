<script setup lang="ts">
import girlUsingLaptop from '@images/pages/girl-using-laptop.png'

// Типы данных для Шаблон
interface Templates {
  id: number
  name: string
  message: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  edit: [template: Templates]
  delete: [template: Templates]
  add: []
  toggleStatus: [template: Templates, newValue: boolean | null]
}>()

// Функция для определения варианта статуса
const resolveStatusVariant = (isActive: boolean) => {
  if (isActive)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

// Props
interface Props {
  templates: Templates[]
  loading: boolean
}

const editTemplate = (template: Templates) => {
  emit('edit', template)
}

const deleteTemplate = (template: Templates) => {
  emit('delete', template)
}

const addNewTemplate = () => {
  emit('add')
}

const toggleStatus = (template: Templates, newValue: boolean | null) => {
  emit('toggleStatus', template, newValue)
}
</script>

<template>
  <VRow>
    <!-- 👉 Templates -->
    <VCol
      v-for="template in props.templates"
      :key="template.id"
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard>
        <VCardText class="d-flex align-center pb-4">
          <div class="text-body-1">
            Шаблон {{ template.isActive ? 'активен' : 'не активен' }}
          </div>

          <VSpacer />

          <VSwitch
            :model-value="template.isActive"
            color="primary"
            hide-details
            @update:model-value="(val) => toggleStatus(template, val)"
          />
        </VCardText>

        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h5 class="text-h5 mb-1">
                {{ template.name }}
              </h5>
              <div class="d-flex align-center">
                <a
                  href="javascript:void(0)"
                  @click="editTemplate(template)"
                >
                  Редактировать
                </a>
              </div>
            </div>
            <IconBtn
              class="align-self-end"
              @click="deleteTemplate(template)"
            >
              <VIcon
                icon="bx-trash"
                class="text-error"
              />
            </IconBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Add New Template -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="h-100"
        :ripple="false"
      >
        <VRow
          no-gutters
          class="h-100"
        >
          <VCol
            cols="6"
            class="d-flex flex-column justify-end align-center mt-5"
          >
            <img
              width="105"
              :src="girlUsingLaptop"
            >
          </VCol>

          <VCol cols="6">
            <VCardText class="d-flex flex-column align-end justify-end gap-4">
              <VBtn
                size="small"
                @click="addNewTemplate"
              >
                Добавить шаблон
              </VBtn>
              <div class="text-end">
                Добавить новый шаблон,<br> если он не существует.
              </div>
            </VCardText>
          </VCol>
        </VRow>
      </VCard>
    </VCol>
  </VRow>
</template>н
