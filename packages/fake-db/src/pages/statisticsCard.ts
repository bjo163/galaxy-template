// Type Imports
import type { ThemeColor } from '@galaxy/types/base'

// Data Type
export type StatisticsCardDataType = {
  icon: string
  stats: string
  title: string
  color: ThemeColor
}

// Centralized statistics card records (previously inline in StatisticsCard.tsx)
export const db: { statisticsCard: StatisticsCardDataType[] } = {
  statisticsCard: [
    {
      stats: '230k',
      title: 'Sales',
      color: 'primary',
      icon: 'tabler-chart-pie-2'
    },
    {
      color: 'info',
      stats: '8.549k',
      title: 'Customers',
      icon: 'tabler-users'
    },
    {
      color: 'error',
      stats: '1.423k',
      title: 'Products',
      icon: 'tabler-shopping-cart'
    },
    {
      stats: '$9745',
      color: 'success',
      title: 'Revenue',
      icon: 'tabler-currency-dollar'
    }
  ]
}
