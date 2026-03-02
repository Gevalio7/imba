import { useCookie } from '#imports'
import { defineStore } from 'pinia'

export const useMenuModeStore = defineStore('menuMode', () => {
  const isOldMenu = useCookie('isOldMenu', { default: () => false })
  
  const toggleMenu = () => {
    isOldMenu.value = !isOldMenu.value
  }
  
  const setOldMenu = (value: boolean) => {
    isOldMenu.value = value
  }
  
  return {
    isOldMenu,
    toggleMenu,
    setOldMenu
  }
})
