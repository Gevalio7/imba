import { computed } from 'vue'
import appsAndPages from './apps-and-pages'
import charts from './charts'
import dashboard from './dashboard'
import forms from './forms'
import others from './others'
import uiElements from './ui-elements'

// Old menu imports
import appsAndPagesOld from './apps-and-pages-old'
import chartsOld from './charts-old'
import dashboardOld from './dashboard-old'
import formsOld from './forms-old'
import othersOld from './others-old'
import uiElementsOld from './ui-elements-old'

import type { VerticalNavItems } from '@layouts/types'

// New menu (current - simplified)
const newMenu = [...dashboard, ...appsAndPages, ...uiElements, ...forms, ...charts, ...others] as VerticalNavItems

// Old menu (full)
const oldMenu = [...dashboardOld, ...appsAndPagesOld, ...uiElementsOld, ...formsOld, ...chartsOld, ...othersOld] as VerticalNavItems

// Reactive menu that responds to localStorage changes
export default computed(() => {
  if (typeof window === 'undefined') return newMenu
  
  const isOldMenu = localStorage.getItem('isOldMenu') === 'true'
  
  return isOldMenu ? oldMenu : newMenu
})
