<script setup lang="ts">
import AnalyticsActivityTimeline from '@/views/dashboards/analytics/AnalyticsActivityTimeline.vue'
import AnalyticsCongratulations from '@/views/dashboards/analytics/AnalyticsCongratulations.vue'
import AnalyticsFinanceTabs from '@/views/dashboards/analytics/AnalyticsFinanceTabs.vue'
import AnalyticsOrder from '@/views/dashboards/analytics/AnalyticsOrder.vue'
import AnalyticsOrderStatistics from '@/views/dashboards/analytics/AnalyticsOrderStatistics.vue'
import AnalyticsProfitReport from '@/views/dashboards/analytics/AnalyticsProfitReport.vue'
import AnalyticsRevenue from '@/views/dashboards/analytics/AnalyticsRevenue.vue'
import AnalyticsSystemTabs from '@/views/dashboards/analytics/AnalyticsSystemTabs.vue'
import AnalyticsTotalRevenue from '@/views/dashboards/analytics/AnalyticsTotalRevenue.vue'
import AnalyticsTransactions from '@/views/dashboards/analytics/AnalyticsTransactions.vue'
import { useUserPermissions } from '@/composables/useUserPermissions'

// 👉 Images
import paypal from '@images/cards/paypal-error.png'
import wallet from '@images/cards/wallet-info.png'

// Загружаем права при заходе на защищённую страницу
const { loadPermissions } = useUserPermissions()
loadPermissions()

const statisticsVertical = [
  {
    title: 'Sales',
    color: 'info',
    image: wallet,
    stats: '$4,679',
    change: 28.14,
  },
  {
    title: 'Payments',
    color: 'error',
    image: paypal,
    stats: '$2,468',
    change: -14.82,
  },
]
</script>

<template>
  <VRow class="match-height">
    <!-- 👉 congratulations -->
    <VCol
      cols="12"
      md="8"
    >
      <AnalyticsCongratulations />
    </VCol>

    <VCol
      cols="12"
      sm="4"
    >
      <VRow>
        <!-- 👉 Sales -->
        <VCol
          cols="12"
          md="6"
        >
          <AnalyticsOrder />
        </VCol>

        <!-- 👉 Orders -->
        <VCol
          cols="12"
          md="6"
        >
          <CardStatisticsVertical v-bind="statisticsVertical[0]" />
        </VCol>
      </VRow>
    </VCol>

    <!-- 👉 Total Revenue -->
    <VCol
      cols="12"
      md="8"
      order="2"
      order-md="1"
    >
      <AnalyticsTotalRevenue />
    </VCol>

    <VCol
      cols="12"
      sm="8"
      md="4"
      order="1"
      order-md="2"
    >
      <VRow>
        <!-- 👉 Payments -->
        <VCol
          cols="12"
          sm="6"
        >
          <CardStatisticsVertical v-bind="statisticsVertical[1]" />
        </VCol>

        <!-- 👉 Revenue -->
        <VCol
          cols="12"
          sm="6"
        >
          <AnalyticsRevenue />
        </VCol>
      </VRow>

      <VRow>
        <!-- 👉 Profit Report -->
        <VCol
          cols="12"
          sm="12"
        >
          <AnalyticsProfitReport />
        </VCol>
      </VRow>
    </VCol>

    <!-- 👉 Order Statistics -->
    <VCol
      cols="12"
      md="4"
      sm="6"
      order="3"
    >
      <AnalyticsOrderStatistics />
    </VCol>

    <!-- 👉 Tabs chart -->
    <VCol
      cols="12"
      md="4"
      sm="6"
      order="3"
    >
      <AnalyticsFinanceTabs />
    </VCol>

    <!-- 👉 Transactions -->
    <VCol
      cols="12"
      md="4"
      sm="6"
      order="3"
    >
      <AnalyticsTransactions />
    </VCol>

    <!-- 👉 Activity Timeline -->
    <VCol
      cols="12"
      order-md="3"
      order="4"
      md="6"
    >
      <AnalyticsActivityTimeline />
    </VCol>

    <!-- 👉 Tabs -->
    <VCol
      cols="12"
      order="3"
      sm="6"
    >
      <AnalyticsSystemTabs />
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/libs/apex-chart.scss";
</style>
