import { computed } from 'vue'
import appsAndPages from './apps-and-pages'
import charts from './charts'
import dashboard from './dashboard'
import forms from './forms'
import others from './others'
import uiElements from './ui-elements'

import type { VerticalNavItems } from '@layouts/types'

// New menu (current - simplified)
const newMenu = [...dashboard, ...appsAndPages, ...uiElements, ...forms, ...charts, ...others] as VerticalNavItems

export default computed(() => newMenu)
