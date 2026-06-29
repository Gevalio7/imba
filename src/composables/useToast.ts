import { ref } from 'vue'

const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref<'success' | 'error' | 'warning' | 'info'>('success')

export const useToast = () => {
  const showToast = (message: string, color: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    toastMessage.value = message
    toastColor.value = color
    isToastVisible.value = true
  }

  return {
    showToast,
    isToastVisible,
    toastMessage,
    toastColor,
  }
}
