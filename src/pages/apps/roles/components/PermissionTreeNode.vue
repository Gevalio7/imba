<script setup lang="ts">
import { categoryIcons } from '@/constants/roleMenuConfig'

const props = defineProps<{
  category: any
  childPermission: (code: string, type: 'read' | 'write' | 'delete') => boolean
  onSetChildPermission: (code: string, type: 'read' | 'write' | 'delete', val: boolean) => void
  onToggleCategory: (type: 'read' | 'write' | 'delete', val: boolean) => void
  parentState: (type: 'read' | 'write' | 'delete') => { value: boolean; indeterminate: boolean }
  permissionLevel: (code: string, type: 'read' | 'write' | 'delete') => number
  onUpdatePermissionLevel: (code: string, type: 'read' | 'write' | 'delete', level: number) => void
  accessLevels: Array<any>
}>()

const icon = categoryIcons[props.category.category] || 'bx-menu'
</script>

<template>
  <div>
    <div class="d-flex align-center w-100">
      <VIcon
        :icon="icon"
        class="mr-3"
        color="grey"
        size="22"
      />
      <span class="text-subtitle-1 font-weight-medium">{{ category.label }}</span>

      <div class="ml-auto d-flex gap-6">
        <div class="d-flex align-center permission-check">
          <span class="text-caption mr-2 permission-label">Чтение</span>
          <VCheckbox
            :model-value="parentState('read').value"
            :indeterminate="parentState('read').indeterminate"
            density="compact"
            hide-details
            color="primary"
            @update:model-value="(val) => onToggleCategory('read', !!val)"
            @click.stop
          />
        </div>
        <div class="d-flex align-center permission-check">
          <span class="text-caption mr-2 permission-label">Запись</span>
          <VCheckbox
            :model-value="parentState('write').value"
            :indeterminate="parentState('write').indeterminate"
            density="compact"
            hide-details
            color="primary"
            @update:model-value="(val) => onToggleCategory('write', !!val)"
            @click.stop
          />
        </div>
        <div class="d-flex align-center permission-check">
          <span class="text-caption mr-2 permission-label">Удаление</span>
          <VCheckbox
            :model-value="parentState('delete').value"
            :indeterminate="parentState('delete').indeterminate"
            density="compact"
            hide-details
            color="primary"
            @update:model-value="(val) => onToggleCategory('delete', !!val)"
            @click.stop
          />
        </div>
      </div>
    </div>

    <div class="pl-9">
      <VList
        density="comfortable"
        class="bg-transparent"
      >
        <VListItem
          v-for="child in category.children"
          :key="child.id"
          class="px-0 menu-child-item"
        >
          <div class="d-flex align-center w-100">
            <VIcon
              icon="bx-dot"
              size="16"
              class="mr-2"
              color="grey"
            />
            <span class="text-body-2">{{ child.label }}</span>
            <div class="ml-auto d-flex gap-6 align-center">
              <div
                v-for="t in (['read', 'write', 'delete'] as const)"
                :key="t"
                class="d-flex align-center permission-cell"
              >
                <VCheckbox
                  v-if="child.code"
                  :model-value="childPermission(child.code!, t)"
                  density="compact"
                  hide-details
                  color="primary"
                  @update:model-value="(val) => onSetChildPermission(child.code!, t, !!val)"
                  @click.stop
                />
                <VMenu
                  v-if="child.code"
                  :close-on-content-click="true"
                  location="bottom end"
                >
                  <template #activator="{ props: menuProps }">
                    <VChip
                      v-bind="menuProps"
                      size="x-small"
                      variant="tonal"
                      :color="permissionLevel(child.code!, t) === 0 ? 'grey' : 'primary'"
                      class="permission-level-chip ml-1"
                      @click.stop
                    >
                      {{ permissionLevel(child.code!, t) }}
                    </VChip>
                  </template>
                  <VList density="compact">
                    <VListItem
                      v-for="opt in accessLevels"
                      :key="opt.level"
                      :value="opt.level"
                      :active="permissionLevel(child.code!, t) === opt.level"
                      @click="onUpdatePermissionLevel(child.code!, t, opt.level)"
                    >
                      <VListItemTitle class="d-flex align-center">
                        <VChip
                          size="x-small"
                          :color="opt.level === 0 ? 'grey' : 'primary'"
                          variant="tonal"
                          class="mr-2"
                        >
                          {{ opt.level }}
                        </VChip>
                        <span class="text-caption">{{ opt.description }}</span>
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </div>
            </div>
          </div>
        </VListItem>
      </VList>
    </div>
  </div>
</template>
