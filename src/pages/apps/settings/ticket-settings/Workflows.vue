<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

// Типы данных
interface WorkflowTransition {
  id: number
  workflowId: number
  sourceStatusId: number | null
  targetStatusId: number
  actionLabel: string
  sortOrder: number
  isActive: boolean
  sourceStatusName?: string
  sourceStatusColor?: string
  targetStatusName: string
  targetStatusColor?: string
}

interface Workflow {
  id: number
  name: string
  description: string
  isActive: boolean
  transitionsCount?: number
  transitions?: WorkflowTransition[]
}

interface State {
  id: number
  name: string
  color?: string
}

interface WorkflowNode {
  id: number | string
  name: string
  color: string
  x: number
  y: number
  isStart?: boolean
}

interface WorkflowEdge {
  id: number
  sourceId: number | string
  targetId: number | string
  label: string
  transition: WorkflowTransition
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Тема
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

// Цвета для темы
const themeColors = computed(() => ({
  canvasBg: isDark.value ? '#1e1e1e' : '#fafafa',
  canvasBorder: isDark.value ? '#424242' : '#e0e0e0',
  gridColor: isDark.value ? '#333333' : '#e8e8e8',
  nodeBg: isDark.value ? '#2d2d2d' : '#fff',
  nodeBgSelected: isDark.value ? '#1a3a5c' : '#e3f2fd',
  nodeText: isDark.value ? '#e0e0e0' : '#333333',
  edgeColor: isDark.value ? '#888888' : '#666666',
  edgeSelected: '#1976d2',
  labelBg: isDark.value ? '#3d3d3d' : '#fff',
  labelBgSelected: '#1976d2',
  labelText: isDark.value ? '#e0e0e0' : '#333333',
  labelTextSelected: '#fff',
  labelBorder: isDark.value ? '#555555' : '#dddddd',
  scrollbarTrack: isDark.value ? '#2d2d2d' : '#f1f1f1',
  scrollbarThumb: isDark.value ? '#555555' : '#c1c1c1',
  scrollbarThumbHover: isDark.value ? '#666666' : '#a1a1a1',
}))

// Store
const workflows = ref<Workflow[]>([])
const states = ref<State[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Выбранный воркфлоу
const selectedWorkflow = ref<Workflow | null>(null)
const selectedWorkflowId = ref<number | null>(null)

// Диалоги
const editWorkflowDialog = ref(false)
const editTransitionDialog = ref(false)
const deleteWorkflowDialog = ref(false)
const deleteTransitionDialog = ref(false)

// Формы
const workflowForm = ref<Partial<Workflow>>({})
const transitionForm = ref<Partial<WorkflowTransition>>({})
const editedTransitionIndex = ref(-1)

// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

// Визуальный редактор
const viewMode = ref<'table' | 'visual'>('visual')
const svgContainer = ref<SVGSVGElement | null>(null)
const canvasWrapper = ref<HTMLDivElement | null>(null)
const containerRect = ref({ width: 800, height: 500 })
const nodes = ref<WorkflowNode[]>([])
const edges = ref<WorkflowEdge[]>([])
const draggedNode = ref<WorkflowNode | null>(null)
const dragOffset = ref({ x: 0, y: 0 })
const selectedNode = ref<WorkflowNode | null>(null)
const selectedEdge = ref<WorkflowEdge | null>(null)
const creatingTransition = ref(false)
const transitionStartNode = ref<WorkflowNode | null>(null)
const tempLine = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

// Динамические размеры SVG
const svgWidth = computed(() => {
  if (nodes.value.length === 0) return containerRect.value.width
  const maxX = Math.max(...nodes.value.map(n => n.x + NODE_WIDTH + 50))
  return Math.max(containerRect.value.width, maxX)
})

const svgHeight = computed(() => {
  if (nodes.value.length === 0) return 500
  const maxY = Math.max(...nodes.value.map(n => n.y + NODE_HEIGHT + 50))
  return Math.max(500, maxY)
})

// Позиции узлов (сохраняются в localStorage)
const nodePositions = ref<Record<string, { x: number; y: number }>>({})

// Константы для визуализации
const NODE_WIDTH = 140
const NODE_HEIGHT = 50
const NODE_RADIUS = 8

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Загрузка данных
const fetchWorkflows = async () => {
  try {
    loading.value = true
    const data = await $fetch<{ workflows: Workflow[] }>(`${API_BASE}/workflows`)
    workflows.value = data.workflows || []
  } catch (err) {
    error.value = 'Ошибка загрузки воркфлоу'
    console.error('Error fetching workflows:', err)
  } finally {
    loading.value = false
  }
}

const fetchStates = async () => {
  try {
    const data = await $fetch<{ states: State[] }>(`${API_BASE}/states`)
    states.value = data.states || []
  } catch (err) {
    console.error('Error fetching states:', err)
  }
}

const fetchWorkflowDetails = async (id: number) => {
  try {
    loading.value = true
    const data = await $fetch<Workflow>(`${API_BASE}/workflows/${id}/full`)
    selectedWorkflow.value = data
    buildVisualization()
  } catch (err) {
    error.value = 'Ошибка загрузки воркфлоу'
    console.error('Error fetching workflow details:', err)
  } finally {
    loading.value = false
  }
}

// Выбор воркфлоу
const selectWorkflow = (workflow: Workflow) => {
  selectedWorkflowId.value = workflow.id
  fetchWorkflowDetails(workflow.id)
}

// Опции для селектов
const stateOptions = computed(() => 
  states.value.map(s => ({ title: s.name, value: s.id }))
)

// Методы для воркфлоу
const openCreateWorkflow = () => {
  workflowForm.value = { name: '', description: '', isActive: true }
  editWorkflowDialog.value = true
}

const openEditWorkflow = (workflow: Workflow) => {
  workflowForm.value = { ...workflow }
  editWorkflowDialog.value = true
}

const saveWorkflow = async () => {
  if (!workflowForm.value.name?.trim()) {
    showToast('Название обязательно', 'error')
    return
  }

  try {
    if (workflowForm.value.id) {
      await $fetch(`${API_BASE}/workflows/${workflowForm.value.id}`, {
        method: 'PUT',
        body: workflowForm.value
      })
      showToast('Воркфлоу обновлен')
    } else {
      await $fetch(`${API_BASE}/workflows`, {
        method: 'POST',
        body: workflowForm.value
      })
      showToast('Воркфлоу создан')
    }
    editWorkflowDialog.value = false
    await fetchWorkflows()
  } catch (err) {
    showToast('Ошибка сохранения', 'error')
  }
}

const confirmDeleteWorkflow = (workflow: Workflow) => {
  workflowForm.value = { ...workflow }
  deleteWorkflowDialog.value = true
}

const deleteWorkflow = async () => {
  try {
    await $fetch(`${API_BASE}/workflows/${workflowForm.value.id}`, {
      method: 'DELETE'
    })
    showToast('Воркфлоу удален')
    deleteWorkflowDialog.value = false
    selectedWorkflow.value = null
    selectedWorkflowId.value = null
    // Удаляем сохраненные позиции
    localStorage.removeItem(`workflow_positions_${workflowForm.value.id}`)
    await fetchWorkflows()
  } catch (err) {
    showToast('Ошибка удаления', 'error')
  }
}

// Методы для переходов
const openCreateTransition = (sourceId?: number | string, targetId?: number | string) => {
  transitionForm.value = {
    workflowId: selectedWorkflowId.value,
    sourceStatusId: sourceId && typeof sourceId === 'number' ? sourceId : null,
    targetStatusId: targetId && typeof targetId === 'number' ? targetId : undefined,
    actionLabel: '',
    sortOrder: (selectedWorkflow.value?.transitions?.length || 0) + 1,
    isActive: true
  }
  editedTransitionIndex.value = -1
  editTransitionDialog.value = true
}

const openEditTransition = (transition: WorkflowTransition, index: number) => {
  transitionForm.value = { ...transition }
  editedTransitionIndex.value = index
  editTransitionDialog.value = true
}

const saveTransition = async () => {
  if (!transitionForm.value.actionLabel?.trim()) {
    showToast('Название действия обязательно', 'error')
    return
  }
  if (!transitionForm.value.targetStatusId) {
    showToast('Целевой статус обязателен', 'error')
    return
  }

  try {
    if (transitionForm.value.id) {
      await $fetch(`${API_BASE}/workflows/${selectedWorkflowId.value}/transitions/${transitionForm.value.id}`, {
        method: 'PUT',
        body: transitionForm.value
      })
      showToast('Переход обновлен')
    } else {
      await $fetch(`${API_BASE}/workflows/${selectedWorkflowId.value}/transitions`, {
        method: 'POST',
        body: transitionForm.value
      })
      showToast('Переход создан')
    }
    editTransitionDialog.value = false
    if (selectedWorkflowId.value) {
      await fetchWorkflowDetails(selectedWorkflowId.value)
    }
  } catch (err) {
    showToast('Ошибка сохранения', 'error')
  }
}

const confirmDeleteTransition = (transition: WorkflowTransition, index: number) => {
  transitionForm.value = { ...transition }
  editedTransitionIndex.value = index
  deleteTransitionDialog.value = true
}

const deleteTransition = async () => {
  try {
    await $fetch(`${API_BASE}/workflows/${selectedWorkflowId.value}/transitions/${transitionForm.value.id}`, {
      method: 'DELETE'
    })
    showToast('Переход удален')
    deleteTransitionDialog.value = false
    if (selectedWorkflowId.value) {
      await fetchWorkflowDetails(selectedWorkflowId.value)
    }
  } catch (err) {
    showToast('Ошибка удаления', 'error')
  }
}

// Перемещение переходов
const moveTransitionUp = async (transition: WorkflowTransition, index: number) => {
  if (index <= 0 || !selectedWorkflow.value?.transitions) return
  
  const prevTransition = selectedWorkflow.value.transitions[index - 1]
  
  try {
    await $fetch(`${API_BASE}/workflows/${selectedWorkflowId.value}/transitions/${transition.id}`, {
      method: 'PUT',
      body: { sortOrder: prevTransition.sortOrder }
    })
    await $fetch(`${API_BASE}/workflows/${selectedWorkflowId.value}/transitions/${prevTransition.id}`, {
      method: 'PUT',
      body: { sortOrder: transition.sortOrder }
    })
    await fetchWorkflowDetails(selectedWorkflowId.value!)
    showToast('Порядок изменен')
  } catch (err) {
    showToast('Ошибка изменения порядка', 'error')
  }
}

const moveTransitionDown = async (transition: WorkflowTransition, index: number) => {
  if (!selectedWorkflow.value?.transitions || index >= selectedWorkflow.value.transitions.length - 1) return
  
  const nextTransition = selectedWorkflow.value.transitions[index + 1]
  
  try {
    await $fetch(`${API_BASE}/workflows/${selectedWorkflowId.value}/transitions/${transition.id}`, {
      method: 'PUT',
      body: { sortOrder: nextTransition.sortOrder }
    })
    await $fetch(`${API_BASE}/workflows/${selectedWorkflowId.value}/transitions/${nextTransition.id}`, {
      method: 'PUT',
      body: { sortOrder: transition.sortOrder }
    })
    await fetchWorkflowDetails(selectedWorkflowId.value!)
    showToast('Порядок изменен')
  } catch (err) {
    showToast('Ошибка изменения порядка', 'error')
  }
}

// ==================== ВИЗУАЛИЗАЦИЯ ====================

// Загрузка позиций из localStorage
const loadPositions = () => {
  if (!selectedWorkflowId.value) return
  const saved = localStorage.getItem(`workflow_positions_${selectedWorkflowId.value}`)
  if (saved) {
    try {
      nodePositions.value = JSON.parse(saved)
    } catch (e) {
      nodePositions.value = {}
    }
  }
}

// Сохранение позиций в localStorage
const savePositions = () => {
  if (!selectedWorkflowId.value) return
  const positions: Record<string, { x: number; y: number }> = {}
  nodes.value.forEach(node => {
    positions[String(node.id)] = { x: node.x, y: node.y }
  })
  nodePositions.value = positions
  localStorage.setItem(`workflow_positions_${selectedWorkflowId.value}`, JSON.stringify(positions))
}

// Получение цвета статуса
const getStateColor = (stateId: number | null): string => {
  if (!stateId) return '#9e9e9e' // серый для начального узла
  const state = states.value.find(s => s.id === stateId)
  return state?.color || '#1976d2'
}

// Получение имени статуса
const getStateName = (stateId: number | null): string => {
  if (!stateId) return 'Начало'
  const state = states.value.find(s => s.id === stateId)
  return state?.name || 'Неизвестно'
}

// Построение визуализации
const buildVisualization = () => {
  if (!selectedWorkflow.value) return
  
  loadPositions()
  
  const transitions = selectedWorkflow.value.transitions || []
  const nodeMap = new Map<number | string, WorkflowNode>()
  
  // Собираем все уникальные статусы
  transitions.forEach(t => {
    if (t.sourceStatusId === null) {
      // Начальный узел
      if (!nodeMap.has('start')) {
        nodeMap.set('start', {
          id: 'start',
          name: 'Начало',
          color: '#9e9e9e',
          x: nodePositions.value['start']?.x || 50,
          y: nodePositions.value['start']?.y || containerRect.value.height / 2,
          isStart: true
        })
      }
    } else if (!nodeMap.has(t.sourceStatusId)) {
      nodeMap.set(t.sourceStatusId, {
        id: t.sourceStatusId,
        name: t.sourceStatusName || getStateName(t.sourceStatusId),
        color: t.sourceStatusColor || getStateColor(t.sourceStatusId),
        x: nodePositions.value[t.sourceStatusId]?.x || 200 + nodeMap.size * 150,
        y: nodePositions.value[t.sourceStatusId]?.y || 100 + (nodeMap.size % 3) * 100
      })
    }
    
    if (!nodeMap.has(t.targetStatusId)) {
      nodeMap.set(t.targetStatusId, {
        id: t.targetStatusId,
        name: t.targetStatusName || getStateName(t.targetStatusId),
        color: t.targetStatusColor || getStateColor(t.targetStatusId),
        x: nodePositions.value[t.targetStatusId]?.x || 200 + nodeMap.size * 150,
        y: nodePositions.value[t.targetStatusId]?.y || 100 + (nodeMap.size % 3) * 100
      })
    }
  })
  
  // Если переходов нет, показываем все статусы
  if (nodeMap.size === 0) {
    states.value.forEach((state, index) => {
      nodeMap.set(state.id, {
        id: state.id,
        name: state.name,
        color: state.color || '#1976d2',
        x: nodePositions.value[state.id]?.x || 100 + (index % 4) * 180,
        y: nodePositions.value[state.id]?.y || 100 + Math.floor(index / 4) * 100
      })
    })
  }
  
  nodes.value = Array.from(nodeMap.values())
  
  // Строим ребра
  edges.value = transitions.map(t => ({
    id: t.id,
    sourceId: t.sourceStatusId === null ? 'start' : t.sourceStatusId,
    targetId: t.targetStatusId,
    label: t.actionLabel,
    transition: t
  }))
  
  // Автоматическое размещение если нет сохраненных позиций
  if (Object.keys(nodePositions.value).length === 0) {
    autoLayout()
  }
}

// Автоматическое размещение узлов
const autoLayout = () => {
  const padding = 50
  const levelWidth = 200
  const nodeSpacingY = 80
  
  // Определяем уровни для каждого узла (BFS от начального узла)
  const levelMap = new Map<number | string, number>()
  const startNode = nodes.value.find(n => n.isStart)
  
  if (startNode) {
    levelMap.set('start', 0)
    let queue: (number | string)[] = ['start']
    let visited = new Set(['start'])
    
    while (queue.length > 0) {
      const current = queue.shift()!
      const currentLevel = levelMap.get(current) || 0
      
      edges.value.forEach(edge => {
        if (edge.sourceId === current && !visited.has(edge.targetId)) {
          levelMap.set(edge.targetId, currentLevel + 1)
          visited.add(edge.targetId)
          queue.push(edge.targetId)
        }
      })
    }
    
    // Узлы без уровня (недостижимые от начала) размещаем на дополнительных уровнях
    nodes.value.forEach(node => {
      if (!levelMap.has(node.id)) {
        const maxLevel = Math.max(0, ...Array.from(levelMap.values()))
        levelMap.set(node.id, maxLevel + 1)
      }
    })
  }
  
  // Группируем узлы по уровням
  const levels: (number | string)[][] = []
  nodes.value.forEach(node => {
    const level = levelMap.get(node.id) ?? 0
    if (!levels[level]) levels[level] = []
    levels[level].push(node.id)
  })
  
  // Находим максимальное количество узлов на уровне для расчета высоты
  const maxNodesInLevel = Math.max(...levels.map(l => l.length), 1)
  
  // Размещаем узлы по уровням
  levels.forEach((levelNodes, levelIndex) => {
    const totalHeight = (levelNodes.length - 1) * nodeSpacingY + NODE_HEIGHT
    const startY = Math.max(padding, (maxNodesInLevel - 1) * nodeSpacingY / 2 - totalHeight / 2 + padding)
    
    levelNodes.forEach((nodeId, nodeIndex) => {
      const node = nodes.value.find(n => n.id === nodeId)
      if (node) {
        node.x = padding + levelIndex * levelWidth
        node.y = startY + nodeIndex * nodeSpacingY
      }
    })
  })
  
  // Если нет ребер, размещаем сеткой
  if (edges.value.length === 0) {
    const cols = Math.max(4, Math.ceil(Math.sqrt(nodes.value.length)))
    nodes.value.forEach((node, index) => {
      node.x = padding + (index % cols) * (NODE_WIDTH + 40)
      node.y = padding + Math.floor(index / cols) * (NODE_HEIGHT + 30)
    })
  }
  
  savePositions()
}

// Обработчики событий для drag-and-drop
const onNodeMouseDown = (event: MouseEvent, node: WorkflowNode) => {
  if (creatingTransition.value) return
  
  draggedNode.value = node
  const svg = (event.target as Element).closest('svg')
  const wrapper = canvasWrapper.value
  
  if (svg && wrapper) {
    const rect = svg.getBoundingClientRect()
    const scrollLeft = wrapper.scrollLeft
    const scrollTop = wrapper.scrollTop
    dragOffset.value = {
      x: event.clientX - rect.left - node.x + scrollLeft,
      y: event.clientY - rect.top - node.y + scrollTop
    }
  }
  event.preventDefault()
}

const onMouseMove = (event: MouseEvent) => {
  if (draggedNode.value && svgContainer.value && canvasWrapper.value) {
    const rect = svgContainer.value.getBoundingClientRect()
    const scrollLeft = canvasWrapper.value.scrollLeft
    const scrollTop = canvasWrapper.value.scrollTop
    draggedNode.value.x = Math.max(0, event.clientX - rect.left - dragOffset.value.x + scrollLeft)
    draggedNode.value.y = Math.max(0, event.clientY - rect.top - dragOffset.value.y + scrollTop)
  }
  
  if (creatingTransition.value && transitionStartNode.value && svgContainer.value && canvasWrapper.value) {
    const rect = svgContainer.value.getBoundingClientRect()
    const scrollLeft = canvasWrapper.value.scrollLeft
    const scrollTop = canvasWrapper.value.scrollTop
    tempLine.value = {
      x1: transitionStartNode.value.x + NODE_WIDTH / 2,
      y1: transitionStartNode.value.y + NODE_HEIGHT / 2,
      x2: event.clientX - rect.left + scrollLeft,
      y2: event.clientY - rect.top + scrollTop
    }
  }
}

const onMouseUp = (event: MouseEvent) => {
  if (draggedNode.value) {
    savePositions()
    draggedNode.value = null
  }
}

// Начало создания перехода
const startTransitionCreation = (node: WorkflowNode) => {
  creatingTransition.value = true
  transitionStartNode.value = node
  tempLine.value = {
    x1: node.x + NODE_WIDTH / 2,
    y1: node.y + NODE_HEIGHT / 2,
    x2: node.x + NODE_WIDTH / 2,
    y2: node.y + NODE_HEIGHT / 2
  }
}

// Завершение создания перехода
const finishTransitionCreation = (targetNode: WorkflowNode) => {
  if (transitionStartNode.value && transitionStartNode.value.id !== targetNode.id) {
    openCreateTransition(transitionStartNode.value.id, targetNode.id)
  }
  cancelTransitionCreation()
}

// Отмена создания перехода
const cancelTransitionCreation = () => {
  creatingTransition.value = false
  transitionStartNode.value = null
  tempLine.value = null
}

// Клик по узлу
const onNodeClick = (event: MouseEvent, node: WorkflowNode) => {
  if (creatingTransition.value) {
    finishTransitionCreation(node)
    return
  }
  
  selectedNode.value = selectedNode.value?.id === node.id ? null : node
  selectedEdge.value = null
}

// Клик по ребру
const onEdgeClick = (event: MouseEvent, edge: WorkflowEdge) => {
  event.stopPropagation()
  selectedEdge.value = selectedEdge.value?.id === edge.id ? null : edge
  selectedNode.value = null
}

// Клик по пустому месту
const onSvgClick = (event: MouseEvent) => {
  if (creatingTransition.value) {
    cancelTransitionCreation()
    return
  }
  selectedNode.value = null
  selectedEdge.value = null
}

// Редактирование выбранного перехода
const editSelectedEdge = () => {
  if (!selectedEdge.value) return
  const index = selectedWorkflow.value?.transitions?.findIndex(t => t.id === selectedEdge.value!.id) ?? -1
  if (index >= 0 && selectedWorkflow.value?.transitions) {
    openEditTransition(selectedEdge.value.transition, index)
  }
}

// Удаление выбранного перехода
const deleteSelectedEdge = () => {
  if (!selectedEdge.value) return
  const index = selectedWorkflow.value?.transitions?.findIndex(t => t.id === selectedEdge.value!.id) ?? -1
  if (index >= 0 && selectedWorkflow.value?.transitions) {
    confirmDeleteTransition(selectedEdge.value.transition, index)
  }
}

// Вычисление точек начала и конца ребра (у границ узлов)
const getEdgePoints = (sourceId: number | string, targetId: number | string): { sx: number; sy: number; tx: number; ty: number } => {
  const source = nodes.value.find(n => n.id === sourceId)
  const target = nodes.value.find(n => n.id === targetId)
  
  if (!source || !target) return { sx: 0, sy: 0, tx: 0, ty: 0 }
  
  // Центры узлов
  const scx = source.x + NODE_WIDTH / 2
  const scy = source.y + NODE_HEIGHT / 2
  const tcx = target.x + NODE_WIDTH / 2
  const tcy = target.y + NODE_HEIGHT / 2
  
  // Направление от source к target
  const dx = tcx - scx
  const dy = tcy - scy
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  
  // Нормализованный вектор направления
  const nx = dx / dist
  const ny = dy / dist
  
  // Точка на границе source (с небольшим отступом)
  const sx = scx + nx * (NODE_WIDTH / 2 + 3)
  const sy = scy + ny * (NODE_HEIGHT / 2 + 3)
  
  // Точка на границе target (с отступом для стрелки - меньше для маленькой стрелки)
  const tx = tcx - nx * (NODE_WIDTH / 2 + 10)
  const ty = tcy - ny * (NODE_HEIGHT / 2 + 10)
  
  return { sx, sy, tx, ty }
}

// Вычисление пути для ребра (прямая линия)
const getEdgePath = (sourceId: number | string, targetId: number | string): string => {
  const { sx, sy, tx, ty } = getEdgePoints(sourceId, targetId)
  
  if (sx === 0 && sy === 0 && tx === 0 && ty === 0) return ''
  
  // Простая прямая линия
  return `M ${sx} ${sy} L ${tx} ${ty}`
}

// Получение середины ребра для метки
const getEdgeLabelPos = (sourceId: number | string, targetId: number | string): { x: number; y: number } => {
  const { sx, sy, tx, ty } = getEdgePoints(sourceId, targetId)
  
  return {
    x: (sx + tx) / 2,
    y: (sy + ty) / 2
  }
}

// Обновление размеров контейнера
const updateContainerSize = () => {
  if (canvasWrapper.value) {
    const rect = canvasWrapper.value.getBoundingClientRect()
    containerRect.value = { width: rect.width, height: Math.max(400, rect.height) }
  }
}

// Инициализация
onMounted(async () => {
  await fetchStates()
  await fetchWorkflows()
  
  nextTick(() => {
    updateContainerSize()
    window.addEventListener('resize', updateContainerSize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  })
})

// Следим за изменением выбранного воркфлоу
watch(selectedWorkflowId, () => {
  nodePositions.value = {}
  selectedNode.value = null
  selectedEdge.value = null
})
</script>

<template>
  <div>
    <VCard title="Управление воркфлоу">
      <VCardText>
        <VRow class="mb-4">
          <VCol cols="12" md="6">
            <VBtn
              color="primary"
              prepend-icon="bx-plus"
              class="mr-2"
              @click="openCreateWorkflow"
            >
              Создать воркфлоу
            </VBtn>
          </VCol>
          <VCol cols="12" md="6" class="d-flex justify-end align-center">
            <VBtnToggle v-model="viewMode" mandatory density="compact" variant="outlined">
              <VBtn value="visual" title="Визуальный редактор">
                <VIcon icon="bx-diagram" />
              </VBtn>
              <VBtn value="table" title="Табличный вид">
                <VIcon icon="bx-table" />
              </VBtn>
            </VBtnToggle>
          </VCol>
        </VRow>

        <!-- Индикатор загрузки -->
        <VProgressLinear v-if="loading" indeterminate color="primary" class="mb-4" />

        <!-- Сообщение об ошибке -->
        <VAlert v-if="error" type="error" class="mb-4">
          {{ error }}
        </VAlert>

        <VRow>
          <!-- Список воркфлоу -->
          <VCol cols="12" md="3">
            <VCard variant="outlined">
              <VCardTitle class="text-subtitle-1">
                Список воркфлоу
              </VCardTitle>
              <VDivider />
              <VList density="compact">
                <VListItem
                  v-for="workflow in workflows"
                  :key="workflow.id"
                  :active="selectedWorkflowId === workflow.id"
                  @click="selectWorkflow(workflow)"
                >
                  <template #prepend>
                    <VIcon icon="bx-network-chart" color="success" />
                  </template>
                  <VListItemTitle>{{ workflow.name }}</VListItemTitle>
                  <VListItemSubtitle>
                    {{ workflow.transitionsCount || 0 }} переходов
                  </VListItemSubtitle>
                  <template #append>
                    <VChip size="x-small" :color="workflow.isActive ? 'success' : 'error'">
                      {{ workflow.isActive ? 'Активен' : 'Неактивен' }}
                    </VChip>
                  </template>
                </VListItem>
                <VListItem v-if="workflows.length === 0">
                  <VListItemTitle class="text-medium-emphasis">
                    Нет созданных воркфлоу
                  </VListItemTitle>
                </VListItem>
              </VList>
            </VCard>
          </VCol>

          <!-- Редактор воркфлоу -->
          <VCol cols="12" md="9">
            <VCard v-if="selectedWorkflow" variant="outlined">
              <VCardTitle class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <span>{{ selectedWorkflow.name }}</span>
                  <VChip size="small" :color="selectedWorkflow.isActive ? 'success' : 'error'" class="ml-2">
                    {{ selectedWorkflow.isActive ? 'Активен' : 'Неактивен' }}
                  </VChip>
                </div>
                <div class="d-flex gap-2">
                  <VBtn size="small" variant="tonal" @click="openEditWorkflow(selectedWorkflow)">
                    <VIcon icon="bx-edit" />
                  </VBtn>
                  <VBtn size="small" variant="tonal" color="error" @click="confirmDeleteWorkflow(selectedWorkflow)">
                    <VIcon icon="bx-trash" />
                  </VBtn>
                </div>
              </VCardTitle>
              
              <VCardText v-if="selectedWorkflow.description">
                {{ selectedWorkflow.description }}
              </VCardText>

              <VDivider />

              <!-- Визуальный редактор -->
              <VCardText v-if="viewMode === 'visual'">
                <div class="d-flex align-center justify-space-between mb-4">
                  <span class="text-subtitle-1">Визуальный редактор</span>
                  <div class="d-flex gap-2">
                    <VBtn 
                      size="small" 
                      variant="outlined" 
                      prepend-icon="bx-refresh"
                      @click="autoLayout"
                    >
                      Авто-размещение
                    </VBtn>
                    <VBtn 
                      size="small" 
                      variant="outlined" 
                      color="warning"
                      prepend-icon="bx-reset"
                      @click="() => { nodePositions = {}; localStorage.removeItem(`workflow_positions_${selectedWorkflowId}`); buildVisualization(); }"
                    >
                      Сбросить позиции
                    </VBtn>
                    <VBtn 
                      size="small" 
                      color="primary" 
                      prepend-icon="bx-plus"
                      @click="openCreateTransition()"
                    >
                      Добавить переход
                    </VBtn>
                  </div>
                </div>

                <!-- Панель инструментов для выбранного элемента -->
                <VSlideYTransition>
                  <VAlert v-if="selectedEdge" type="info" variant="tonal" class="mb-4">
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <strong>Переход:</strong> "{{ selectedEdge.label }}"
                        <span class="ml-2 text-medium-emphasis">
                          ({{ selectedEdge.transition.sourceStatusName || 'Начало' }} → {{ selectedEdge.transition.targetStatusName }})
                        </span>
                      </div>
                      <div class="d-flex gap-2">
                        <VBtn size="small" variant="flat" @click="editSelectedEdge">
                          <VIcon icon="bx-edit" class="mr-1" />
                          Редактировать
                        </VBtn>
                        <VBtn size="small" color="error" variant="flat" @click="deleteSelectedEdge">
                          <VIcon icon="bx-trash" class="mr-1" />
                          Удалить
                        </VBtn>
                      </div>
                    </div>
                  </VAlert>
                </VSlideYTransition>

                <!-- SVG-холст с прокруткой -->
                <div 
                  ref="canvasWrapper"
                  class="workflow-canvas"
                  :class="{ 'workflow-canvas--dark': isDark }"
                  :style="{ 
                    width: '100%', 
                    height: '500px',
                    border: creatingTransition ? '2px dashed #1976d2' : `1px solid ${themeColors.canvasBorder}`,
                    borderRadius: '8px',
                    backgroundColor: themeColors.canvasBg,
                    position: 'relative',
                    overflow: 'auto'
                  }"
                >
                  <svg
                    ref="svgContainer"
                    :width="svgWidth"
                    :height="svgHeight"
                    @click="onSvgClick"
                    style="cursor: default; min-inline-size: 100%;"
                  >
                    <!-- Определения -->
                    <defs>
                      <!-- Маленькая аккуратная стрелка -->
                      <marker
                        id="arrowhead"
                        markerWidth="8"
                        markerHeight="6"
                        refX="7"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 8 3, 0 6" :fill="themeColors.edgeColor" />
                      </marker>
                      <marker
                        id="arrowhead-selected"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" :fill="themeColors.edgeSelected" />
                      </marker>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.2"/>
                      </filter>
                    </defs>

                    <!-- Сетка -->
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" :stroke="themeColors.gridColor" stroke-width="0.5"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    <!-- Ребра (переходы) -->
                    <g class="edges">
                      <g
                        v-for="edge in edges"
                        :key="edge.id"
                        @click.stop="onEdgeClick($event, edge)"
                        :style="{ cursor: 'pointer' }"
                      >
                        <!-- Невидимая линия для удобства клика -->
                        <path
                          :d="getEdgePath(edge.sourceId, edge.targetId)"
                          fill="none"
                          stroke="transparent"
                          stroke-width="20"
                        />
                        <!-- Видимая линия -->
                        <path
                          :d="getEdgePath(edge.sourceId, edge.targetId)"
                          fill="none"
                          :stroke="selectedEdge?.id === edge.id ? themeColors.edgeSelected : themeColors.edgeColor"
                          stroke-width="2.5"
                          :marker-end="selectedEdge?.id === edge.id ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'"
                        />
                        <!-- Метка перехода с направлением -->
                        <g :transform="`translate(${getEdgeLabelPos(edge.sourceId, edge.targetId).x}, ${getEdgeLabelPos(edge.sourceId, edge.targetId).y})`">
                          <rect
                            x="-50"
                            y="-12"
                            width="100"
                            height="24"
                            rx="4"
                            :fill="selectedEdge?.id === edge.id ? themeColors.labelBgSelected : themeColors.labelBg"
                            :stroke="selectedEdge?.id === edge.id ? themeColors.edgeSelected : themeColors.labelBorder"
                            stroke-width="1.5"
                          />
                          <!-- Название действия -->
                          <text
                            y="-2"
                            text-anchor="middle"
                            :fill="selectedEdge?.id === edge.id ? themeColors.labelTextSelected : themeColors.labelText"
                            font-size="10"
                            font-weight="600"
                          >
                            {{ edge.label.length > 14 ? edge.label.substring(0, 14) + '...' : edge.label }}
                          </text>
                          <!-- Направление (откуда → куда) -->
                          <text
                            y="8"
                            text-anchor="middle"
                            :fill="selectedEdge?.id === edge.id ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)'"
                            font-size="8"
                          >
                            {{ (edge.transition.sourceStatusName || 'Начало').substring(0, 8) }} → {{ edge.transition.targetStatusName.substring(0, 8) }}
                          </text>
                        </g>
                      </g>
                    </g>

                    <!-- Временная линия при создании перехода -->
                    <line
                      v-if="tempLine"
                      :x1="tempLine.x1"
                      :y1="tempLine.y1"
                      :x2="tempLine.x2"
                      :y2="tempLine.y2"
                      stroke="#1976d2"
                      stroke-width="2"
                      stroke-dasharray="5,5"
                      marker-end="url(#arrowhead-selected)"
                    />

                    <!-- Узлы (статусы) -->
                    <g class="nodes">
                      <g
                        v-for="node in nodes"
                        :key="node.id"
                        :transform="`translate(${node.x}, ${node.y})`"
                        @mousedown="onNodeMouseDown($event, node)"
                        @click.stop="onNodeClick($event, node)"
                        @dblclick.stop="!node.isStart && startTransitionCreation(node)"
                        :style="{ cursor: draggedNode === node ? 'grabbing' : 'grab' }"
                      >
                        <!-- Тень -->
                        <rect
                          :width="NODE_WIDTH"
                          :height="NODE_HEIGHT"
                          :rx="NODE_RADIUS"
                          fill="rgba(0,0,0,0.1)"
                          :x="3"
                          :y="3"
                        />
                        <!-- Фон узла -->
                        <rect
                          :width="NODE_WIDTH"
                          :height="NODE_HEIGHT"
                          :rx="NODE_RADIUS"
                          :fill="selectedNode?.id === node.id ? themeColors.nodeBgSelected : themeColors.nodeBg"
                          :stroke="selectedNode?.id === node.id ? themeColors.edgeSelected : node.color"
                          stroke-width="2"
                          filter="url(#shadow)"
                        />
                        <!-- Цветная полоска сверху -->
                        <rect
                          :width="NODE_WIDTH"
                          height="4"
                          :rx="`${NODE_RADIUS} ${NODE_RADIUS} 0 0`"
                          :fill="node.color"
                        />
                        <!-- Иконка -->
                        <circle
                          cx="20"
                          :cy="NODE_HEIGHT / 2"
                          r="12"
                          :fill="node.color"
                          opacity="0.1"
                        />
                        <text
                          x="20"
                          :y="NODE_HEIGHT / 2 + 4"
                          text-anchor="middle"
                          font-size="12"
                          :fill="node.color"
                        >
                          {{ node.isStart ? '▶' : '●' }}
                        </text>
                        <!-- Название -->
                        <text
                          x="NODE_WIDTH / 2 + 10"
                          :y="NODE_HEIGHT / 2 + 4"
                          text-anchor="middle"
                          font-size="12"
                          font-weight="500"
                          :fill="themeColors.nodeText"
                        >
                          {{ node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name }}
                        </text>
                        <!-- Индикатор создания перехода -->
                        <circle
                          v-if="creatingTransition && transitionStartNode?.id !== node.id"
                          cx="NODE_WIDTH - 15"
                          cy="15"
                          r="8"
                          fill="#4caf50"
                        />
                        <text
                          v-if="creatingTransition && transitionStartNode?.id !== node.id"
                          :x="NODE_WIDTH - 15"
                          y="18"
                          text-anchor="middle"
                          font-size="10"
                          fill="#fff"
                        >
                          +
                        </text>
                      </g>
                    </g>
                  </svg>

                  <!-- Подсказка при создании перехода -->
                  <VSlideYTransition>
                    <div 
                      v-if="creatingTransition"
                      class="transition-hint"
                      :style="{
                        position: 'absolute',
                        bottom: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        zIndex: 10
                      }"
                    >
                      <VIcon icon="bx-link" class="mr-1" />
                      Кликните на целевой узел для создания перехода или ESC для отмены
                    </div>
                  </VSlideYTransition>
                </div>

                <!-- Легенда -->
                <div class="d-flex gap-4 mt-4 text-caption text-medium-emphasis">
                  <div class="d-flex align-center gap-1">
                    <VIcon icon="bx-mouse" size="14" />
                    Перетащите узел для перемещения
                  </div>
                  <div class="d-flex align-center gap-1">
                    <VIcon icon="bx-pointer" size="14" />
                    Клик для выбора
                  </div>
                  <div class="d-flex align-center gap-1">
                    <VIcon icon="bx-link" size="14" />
                    Двойной клик для создания перехода
                  </div>
                </div>
              </VCardText>

              <!-- Табличный вид -->
              <VCardText v-else>
                <div class="d-flex align-center justify-space-between mb-4">
                  <span class="text-subtitle-1">Переходы</span>
                  <VBtn size="small" color="primary" prepend-icon="bx-plus" @click="openCreateTransition">
                    Добавить переход
                  </VBtn>
                </div>

                <VTable v-if="selectedWorkflow.transitions?.length">
                  <thead>
                    <tr>
                      <th style="inline-size: 50px;">№</th>
                      <th>Из статуса</th>
                      <th style="inline-size: 50px;"></th>
                      <th>В статус</th>
                      <th>Действие</th>
                      <th style="inline-size: 100px;">Порядок</th>
                      <th style="inline-size: 80px;">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(transition, index) in selectedWorkflow.transitions" :key="transition.id">
                      <td>
                        <VChip size="small" color="primary" variant="tonal">
                          {{ transition.sortOrder }}
                        </VChip>
                      </td>
                      <td>
                        <VChip
                          v-if="transition.sourceStatusName"
                          size="small"
                          :style="{ backgroundColor: transition.sourceStatusColor }"
                          text-color="white"
                        >
                          {{ transition.sourceStatusName }}
                        </VChip>
                        <span v-else class="text-medium-emphasis">
                          <VIcon icon="bx-play-circle" size="small" class="mr-1" />
                          Начало
                        </span>
                      </td>
                      <td class="text-center">
                        <VIcon icon="bx-arrow-right" color="primary" />
                      </td>
                      <td>
                        <VChip
                          size="small"
                          :style="{ backgroundColor: transition.targetStatusColor }"
                          text-color="white"
                        >
                          {{ transition.targetStatusName }}
                        </VChip>
                      </td>
                      <td>
                        <span class="font-weight-medium">{{ transition.actionLabel }}</span>
                      </td>
                      <td>
                        <div class="d-flex flex-column">
                          <IconBtn size="x-small" @click="moveTransitionUp(transition, index)" :disabled="index === 0">
                            <VIcon icon="bx-chevron-up" size="16" />
                          </IconBtn>
                          <IconBtn size="x-small" @click="moveTransitionDown(transition, index)" :disabled="index === selectedWorkflow.transitions!.length - 1">
                            <VIcon icon="bx-chevron-down" size="16" />
                          </IconBtn>
                        </div>
                      </td>
                      <td>
                        <div class="d-flex gap-1">
                          <IconBtn size="small" @click="openEditTransition(transition, index)">
                            <VIcon icon="bx-edit" size="18" />
                          </IconBtn>
                          <IconBtn size="small" color="error" @click="confirmDeleteTransition(transition, index)">
                            <VIcon icon="bx-trash" size="18" />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </VTable>

                <VAlert v-else type="info" variant="tonal">
                  Нет настроенных переходов. Добавьте первый переход для создания воркфлоу.
                </VAlert>
              </VCardText>
            </VCard>

            <VCard v-else variant="outlined" class="d-flex align-center justify-center" style="min-block-size: 300px;">
              <div class="text-center text-medium-emphasis">
                <VIcon icon="bx-network-chart" size="64" color="disabled" />
                <div class="text-h6 mt-4">Выберите воркфлоу</div>
                <div class="text-body-2">для просмотра и редактирования переходов</div>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Диалог создания/редактирования воркфлоу -->
    <VDialog v-model="editWorkflowDialog" max-width="500px">
      <VCard :title="workflowForm.id ? 'Редактировать воркфлоу' : 'Создать воркфлоу'">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppTextField
                v-model="workflowForm.name"
                label="Название *"
                placeholder="Например: Bug Workflow"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="workflowForm.description"
                label="Описание"
                placeholder="Описание назначения воркфлоу"
              />
            </VCol>
            <VCol cols="12">
              <VSwitch
                v-model="workflowForm.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-4">
          <VBtn variant="outlined" @click="editWorkflowDialog = false">Отмена</VBtn>
          <VBtn color="primary" @click="saveWorkflow">Сохранить</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог создания/редактирования перехода -->
    <VDialog v-model="editTransitionDialog" max-width="500px">
      <VCard :title="transitionForm.id ? 'Редактировать переход' : 'Создать переход'">
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppTextField
                v-model="transitionForm.actionLabel"
                label="Название действия *"
                placeholder="Например: Взять в работу, Закрыть, Переоткрыть"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect
                v-model="transitionForm.sourceStatusId"
                :items="stateOptions"
                label="Из статуса"
                placeholder="Оставьте пустым для начального статуса"
                clearable
                hint="NULL = начальный статус для нового тикета"
                persistent-hint
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect
                v-model="transitionForm.targetStatusId"
                :items="stateOptions"
                label="В статус *"
                placeholder="Выберите целевой статус"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model.number="transitionForm.sortOrder"
                label="Порядок"
                type="number"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VSwitch
                v-model="transitionForm.isActive"
                label="Активен"
                color="primary"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-4">
          <VBtn variant="outlined" @click="editTransitionDialog = false">Отмена</VBtn>
          <VBtn color="primary" @click="saveTransition">Сохранить</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления воркфлоу -->
    <VDialog v-model="deleteWorkflowDialog" max-width="400px">
      <VCard title="Удалить воркфлоу?">
        <VCardText>
          Вы уверены, что хотите удалить "{{ workflowForm.name }}"? Все переходы будут удалены.
        </VCardText>
        <VCardText class="d-flex justify-end gap-4">
          <VBtn variant="outlined" @click="deleteWorkflowDialog = false">Отмена</VBtn>
          <VBtn color="error" @click="deleteWorkflow">Удалить</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления перехода -->
    <VDialog v-model="deleteTransitionDialog" max-width="400px">
      <VCard title="Удалить переход?">
        <VCardText>
          Вы уверены, что хотите удалить переход "{{ transitionForm.actionLabel }}"?
        </VCardText>
        <VCardText class="d-flex justify-end gap-4">
          <VBtn variant="outlined" @click="deleteTransitionDialog = false">Отмена</VBtn>
          <VBtn color="error" @click="deleteTransition">Удалить</VBtn>
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

.workflow-canvas {
  overflow: auto;
  user-select: none;

  /* Кастомный скроллбар - светлая тема */
  &::-webkit-scrollbar {
    block-size: 8px;
    inline-size: 8px;
  }

  &::-webkit-scrollbar-track {
    border-radius: 4px;
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background: #c1c1c1;

    &:hover {
      background: #a1a1a1;
    }
  }

  /* Темная тема */
  &--dark {
    &::-webkit-scrollbar-track {
      background: #2d2d2d;
    }

    &::-webkit-scrollbar-thumb {
      background: #555;

      &:hover {
        background: #666;
      }
    }
  }

  svg {
    display: block;
    min-block-size: 100%;
    min-inline-size: 100%;
  }
}

.transition-hint {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}
</style>
