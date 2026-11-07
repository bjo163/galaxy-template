export type EcommercePopularProduct = {
  title: string
  imgSrc: string
  amount: string
  subtitle: string
}

// Type Imports
import type { ThemeColor } from '@galaxy/types/base'

export type EcommerceTransaction = {
  title: string
  subtitle: string
  amount: number
  amountDiff?: 'positive' | 'negative'
  avatarColor: ThemeColor
  avatarIcon: string
}

export type EcommerceEarningReport = {
  title: string
  subtitle: string
  amount: string
  trendNumber: number
  avatarColor: ThemeColor
  avatarIcon: string
  trend?: 'positive' | 'negative'
}
