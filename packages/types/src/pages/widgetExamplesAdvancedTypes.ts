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

export type WidgetEarningReport = {
  title: string
  subtitle: string
  amount: string
  trendNumber: number
  avatarIcon: string
  avatarColor: ThemeColor
  trend?: 'positive' | 'negative'
}

export type WidgetTransaction = {
  title: string
  amount: number
  subtitle: string
  avatarIcon: string
  avatarColor: ThemeColor
  amountDiff?: 'positive' | 'negative'
}

export type WidgetOrder = {
  name: string
  address: string
}

export type WidgetOrdersData = Record<'new' | 'preparing' | 'shipping', Array<{ sender: WidgetOrder; receiver: WidgetOrder }>>

export type WidgetDeliveryPerformance = {
  title: string
  value: string
  change: number
  icon: string
  color: ThemeColor
}

export type WidgetTopCourse = {
  title: string
  views: string
  icon: string
  color: ThemeColor
}

export type WidgetPopularInstructor = {
  name: string
  profession: string
  totalCourses: number
  avatar: string
}

export type WidgetUpcomingWebinar = {
  icon: string
  title: string
  value: string
}

export type WidgetAssignmentProgress = {
  title: string
  tasks: number
  progress: number
  color: ThemeColor
}
