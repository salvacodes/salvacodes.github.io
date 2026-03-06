import { ref } from 'vue'

const currentMaxZIndex = ref(10)

export function useZIndex() {
  const getNextZIndex = () => {
    currentMaxZIndex.value += 1
    return currentMaxZIndex.value
  }

  return {
    getNextZIndex
  }
}
