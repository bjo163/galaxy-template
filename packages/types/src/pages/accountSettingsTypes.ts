// Re-export shared types used in account-settings views
export type { RecentDeviceItem, ConnectedAccount, SocialAccount, PaymentMethodCard } from '../apps/userViewTypes'

export type ApiKeyItem = {
  title: string
  access: string
  date: string
  key: string
}
