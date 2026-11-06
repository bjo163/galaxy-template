// Type Imports
import type { ThemeColor } from '../base'

export type LastTransaction = {
  date: string
  trend: string
  imgName: string
  cardType: string
  cardNumber: string
  status: 'verified' | 'rejected' | 'pending' | 'on-hold'
}

export type ActiveProject = {
  title: string
  imgSrc: string
  progress: number
  subtitle: string
  progressColor: ThemeColor
}

export type SalesByCountry = {
  title: string
  imgSrc: string
  subtitle: string
  trendNumber: number
  trend?: 'positive' | 'negative'
}

export type SourceVisit = {
  icon: string
  title: string
  amount: string
  subtitle: string
  trendNumber: number
  trend?: 'positive' | 'negative'
}

export type MonthlyCampaignState = {
  icon: string
  title: string
  amount: string
  avatarColor: ThemeColor
  trendNumber: string
  trend?: 'positive' | 'negative'
}

export type SupportTrackerItem = {
  title: string
  subtitle: string
  avatarIcon: string
  avatarColor?: ThemeColor
}

export type TotalEarning = {
  title: string
  amount: number
  subtitle: string
  avatarIcon: string
  avatarColor: ThemeColor
  amountDiff?: 'positive' | 'negative'
}

export type EarningReport = {
  stats: string
  title: string
  progress: number
  avatarIcon: string
  avatarColor?: ThemeColor
  progressColor?: ThemeColor
}

export type WebsiteAnalyticsSlide = {
  img: string
  title: string
  details: { [key: string]: string }
}

export type ProjectStatusItem = {
  title: string
  amount: string
  trendDiff: number
  trend?: 'positive' | 'negative'
}
