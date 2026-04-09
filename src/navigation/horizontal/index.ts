import { computed } from 'vue'
import appsAndPages from '../vertical/apps-and-pages'
import dashboard from '../vertical/dashboard'

import type { HorizontalNavItems } from '@layouts/types'

// Filter out 'heading' items as they are not supported in horizontal navigation
const filteredAppsAndPages = appsAndPages.filter((item: any) => !('heading' in item))
const filteredDashboard = dashboard.filter((item: any) => !('heading' in item))

const horizontalMenu = [...filteredDashboard, ...filteredAppsAndPages] as HorizontalNavItems

export default computed(() => horizontalMenu)