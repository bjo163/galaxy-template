export type Customer = {
  id: number
  customer: string
  customerId: string
  email: string
  country: string
  countryCode: string
  countryFlag?: string
  order: number
  totalSpent: number
  avatar: string
  status?: string
  contact?: string
}

export type ReferralsType = {
  id: number
  user: string
  email: string
  avatar: string
  referredId: number
  status: string
  value: string
  earning: string
}

export type ReviewType = {
  id: number
  product: string
  companyName: string
  productImage: string
  reviewer: string
  email: string
  avatar: string
  date: string
  status: string
  review: number
  head: string
  para: string
}

export type ProductType = {
  id: number
  productName: string
  category: string
  stock: boolean
  sku: number
  price: string
  qty: number
  status: string
  image: string
  productBrand: string
}

export type OrderType = {
  id: number
  order: string
  customer: string
  email: string
  avatar: string
  payment: number
  status: string
  spent: number
  method: string
  date: string
  time: string
  methodNumber: number
}

export type RatingDistribution = {
  rating: number
  value: number
}

export type ShippingRate = {
  rate: string
  condition: string
  price: string
}

export type NotificationSetting = {
  type: string
  email: boolean
  app: boolean
}

export type OrderItem = {
  productName: string
  productImage: string
  brand: string
  price: number
  quantity: number
  total: number
}

export type AddressData = {
  firstName: string
  lastName: string
  email: string
  country: string
  address1: string
  address2: string
  landmark: string
  city: string
  state: string
  zipCode: string
  taxId: string
  vatNumber: string
  contact: string
}

export type UserDialogData = {
  firstName: string
  lastName: string
  userName: string
  billingEmail: string
  status: string
  role: string
  taxId: string
  contact: string
  language: string[]
  country: string
  useAsBillingAddress: boolean
}

export type ECommerceType = {
  products: ProductType[]
  orderData: OrderType[]
  customerData: Customer[]
  reviews: ReviewType[]
  referrals: ReferralsType[]
  totalReviews: RatingDistribution[]
  shippingRates: Record<'domestic' | 'international', ShippingRate[]>
  notificationSettings: Record<'customer' | 'shipping' | 'orders', NotificationSetting[]>
  orderItems: OrderItem[]
  billingAddress: AddressData
  shippingAddress: AddressData
  userDialogData: UserDialogData
}
