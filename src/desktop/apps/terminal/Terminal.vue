<script setup lang="ts">
import { useZIndex } from '@desktop/window/useZIndex'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  title?: string
  initialX?: number
  initialY?: number
}>()

const { getNextZIndex } = useZIndex()

const position = ref({ x: props.initialX || 0, y: props.initialY || 0 })
const zIndex = ref(10)
const isDragging = ref(false)
const isMobile = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const terminalRef = ref<HTMLElement | null>(null)

const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768 // 'md' breakpoint
}

const bringToFront = () => {
  zIndex.value = getNextZIndex()
}

const onMouseDown = (e: MouseEvent) => {
  if (isMobile.value) return
  window.getSelection()?.removeAllRanges()
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  bringToFront()
}

const onMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    const minVisible = 40
    const width = terminalRef.value?.offsetWidth || 0

    const newX = e.clientX - dragOffset.value.x
    const newY = e.clientY - dragOffset.value.y

    position.value.x = Math.max(-width + minVisible, Math.min(newX, window.innerWidth - minVisible))
    position.value.y = Math.max(0, Math.min(newY, window.innerHeight - minVisible))
  }
}

const onMouseUp = () => {
  isDragging.value = false
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('resize', checkIsMobile)
  checkIsMobile()
  bringToFront()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('resize', checkIsMobile)
})

const style = computed(() => {
  if (isMobile.value) {
    return {
      position: 'relative' as const,
      zIndex: zIndex.value,
      cursor: 'default',
      userSelect: 'auto' as const
    }
  }

  return {
    position: 'absolute' as const,
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    width: 'max-content',
    minWidth: 'max-content',
    zIndex: zIndex.value,
    cursor: isDragging.value ? 'grabbing' : 'default',
    userSelect: isDragging.value ? 'none' : 'auto'
  }
})
</script>

<template>
  <div
    ref="terminalRef"
    class="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl transition-shadow"
    :class="{ 'shadow-emerald-500/20': isDragging }"
    :style="style"
    @mousedown="bringToFront"
  >
    <div
      class="flex items-center gap-2 bg-zinc-800 px-4 py-2"
      :class="{ 'cursor-grab active:cursor-grabbing': !isMobile }"
      @mousedown.stop="onMouseDown"
    >
      <div class="h-3 w-3 rounded-full border border-red-500/50 bg-red-500/20"></div>
      <div class="h-3 w-3 rounded-full border border-amber-500/50 bg-amber-500/20"></div>
      <div class="h-3 w-3 rounded-full border border-emerald-500/50 bg-emerald-500/20"></div>
      <span v-if="props.title" class="ml-2 select-none text-xs text-zinc-500">{{ props.title }}</span>
    </div>
    <div class="space-y-3 p-6">
      <slot />
    </div>
  </div>
</template>
