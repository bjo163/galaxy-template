import type { ThemeColor } from '../base'

export type AdvancedSalesByCountry = {
  title: string
  imgSrc: string
  subtitle: string
  trendNumber: number
  trend?: 'positive' | 'negative'
}

export type WidgetVehicleCondition = {
  title: string
  subtitle: string
  progress: number
  color: ThemeColor
  chipLabel?: string
}

export type WidgetBrowserState = {
  title: string
  imgSrc: string
  progress: number
  percentage: string
  progressColor: ThemeColor
}
