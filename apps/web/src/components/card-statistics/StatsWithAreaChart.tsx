'use client'

import dynamic from 'next/dynamic'

import { CardStatsWithAreaChart } from '@galaxy/ui'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

export default function StatsWithAreaChartWrapper(props: Omit<Parameters<typeof CardStatsWithAreaChart>[0], 'chartComponent'>) {
  return <CardStatsWithAreaChart {...props} chartComponent={AppReactApexCharts} />
}
