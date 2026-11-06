// Type Imports
import type { ThemeColor } from '../base'

export type PaymentMethodCard = {
  name: string
  imgSrc: string
  imgAlt: string
  cardCvv: string
  expiryDate: string
  cardNumber: string
  cardStatus?: string
  badgeColor?: ThemeColor
}

export type RecentDeviceItem = {
  device: string
  browser: string
  location: string
  recentActivity: string
  browserIcon: 'windows' | 'android' | 'apple' | 'mobile'
}

export type ConnectedAccount = {
  title: string
  logo: string
  checked: boolean
  subtitle: string
}

export type SocialAccount = {
  title: string
  logo: string
  username?: string
  isConnected: boolean
  href?: string
}

export type ProjectListItem = {
  id: number
  img: string
  hours: string
  totalTask: string
  projectType: string
  projectTitle: string
  progressValue: number
  progressColor: ThemeColor
}

export type EcommerceCustomerPaymentCard = {
  typeOfCard: string
  isDefaultCard: boolean
  expiryDate: string
}
