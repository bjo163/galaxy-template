import type { ThemeColor } from '../base'

export type CheckoutAddressOption = {
  title: string
  metaLabel: string
  metaColor: ThemeColor
  value: string
  streetAddress: string
  contactInfo: string
  editLabel: string
  removeLabel: string
  isSelected?: boolean
}

export type CheckoutDeliveryOption = {
  value: string
  title: string
  asset: string
  badgeLabel: string
  badgeColor: ThemeColor
  description: string
  isSelected?: boolean
}

export type CheckoutCartProduct = {
  imgSrc: string
  imgAlt: string
  productName: string
  soldBy: string
  inStock: boolean
  price: number
  originalPrice: number
  rating?: number
  count?: number
}

export type WizardCustomOption = {
  title: string
  value: string
  content: string
  asset: string
  isSelected?: boolean
}

export type PropertyListingOption = {
  value: string
  title: string
  contentLines: string[]
  asset: string
  isSelected?: boolean
}

export type ShippingRateOption = {
  title: string
  meta: string
  content: string
  value: string
  isSelected?: boolean
}
