<template>
  <VCard>
    <VCardText>
      <h5>Расширенные права</h5>

      <div>
        <div>
          <div>
            <span>Супер-админ</span>
            <p>Полный доступ ко всем разделам системы</p>
          </div>
          <VSwitch
            :model-value="superAdmin"
            @update:model-value="$emit('update:superAdmin', $event)"
          />
        </div>
      </div>

      <VDivider />

      <div>
        <span>Видеть заявки отдела</span>
        <VSelect
          :model-value="departments"
          :items="departmentsList"
          item-title="name"
          item-value="id"
          multiple
          label="Выберите отделы"
          placeholder="Все отделы"
          @update:model-value="$emit('update:departments', $event)"
        />
        <p>Пользователь будет видеть заявки выбранных отделов</p>
      </div>

      <div>
        <span>Видеть заявки компании</span>
        <VSelect
          :model-value="companies"
          :items="companiesList"
          item-title="name"
          item-value="id"
          multiple
          label="Выберите компании"
          placeholder="Все компании"
          @update:model-value="$emit('update:companies', $event)"
        />
        <p>Пользователь будет видеть заявки выбранных компаний</p>
      </div>

      <VDivider />

      <div>
        <div>
          <div>
            <span>Только свои обращения</span>
            <p>Пользователь видит только заявки, где назначен исполнителем</p>
          </div>
          <VSwitch
            :model-value="onlyOwnTickets"
            @update:model-value="$emit('update:onlyOwnTickets', $event)"
          />
        </div>
      </div>

      <div>
        <div>
          <div>
            <span>Отвечать на заявки</span>
            <p>Возможность добавлять публичные комментарии</p>
          </div>
          <VSwitch
            :model-value="canReply"
            @update:model-value="$emit('update:canReply', $event)"
          />
        </div>
      </div>

      <div>
        <div>
          <div>
            <span>Внутренние заметки</span>
            <p>Возможность добавлять внутренние комментарии (видны только сотрудникам)</p>
          </div>
          <VSwitch
            :model-value="canInternalNotes"
            @update:model-value="$emit('update:canInternalNotes', $event)"
          />
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
interface SelectItem {
  id: number
  name: string
}

defineProps<{
  superAdmin: boolean
  departments: number[]
  companies: number[]
  onlyOwnTickets: boolean
  canReply: boolean
  canInternalNotes: boolean
  departmentsList?: SelectItem[]
  companiesList?: SelectItem[]
}>()

defineEmits<{
  (e: 'update:superAdmin', value: boolean): void
  (e: 'update:departments', value: number[]): void
  (e: 'update:companies', value: number[]): void
  (e: 'update:onlyOwnTickets', value: boolean): void
  (e: 'update:canReply', value: boolean): void
  (e: 'update:canInternalNotes', value: boolean): void
}>()
</script>
