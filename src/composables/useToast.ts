import { ref } from 'vue'

const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref<'success'|'error'>('success')

export const useToast = () => {
  const showToast = (message: string, color: 'success'|'error' = 'success') => {
    toastMessage.value = message
    toastColor.value = color
    isToastVisible.value = true
    // auto-hide after timeout (match component timeout 1200ms)
    setTimeout(() => {
      isToastVisible.value = false
    }, 1200)
  }

  return {
    showToast,
    isToastVisible,
    toastMessage,
    toastColor,
  }
}
