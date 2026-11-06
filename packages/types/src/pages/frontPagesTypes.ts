export type HelpCenterArticleCategory = {
  title: string
  icon: string
  articles: { title: string }[]
}

export type HelpCenterGraphicArticle = {
  slug: string
  title: string
  icon: 'rocket' | 'gift' | 'file' | 'laptop' | 'bulb' | 'discord'
  subtitle: string
}

export type LandingTeamMember = {
  name: string
  position: string
  image: string
  color: string
}

export type LandingFeature = {
  icon: 'laptop-charging' | 'rocket' | 'paper' | 'check' | 'user' | 'document'
  title: string
  description: string
}

export type LandingProductStat = {
  title: string
  value: string
  icon: 'laptop-charging' | 'user' | 'diamond' | 'check'
  color: string
  isHover: boolean
}

export type LandingCustomerReview = {
  desc: string
  logo: 'pinterest' | 'netflix' | 'airbnb' | 'coinbase' | 'dribbble' | 'hubspot'
  logoColor: string
  rating: number
  name: string
  position: string
  avatarSrc: string
}

export type LandingFaq = {
  id: string
  question: string
  answer: string
  active?: boolean
}

/**
 * Marketing pricing card for the landing page section.
 * Separate domain from `PricingPlanType` (subscription) and `PricingPageFeature` (comparison matrix).
 */
export type LandingPricingPlan = {
  title: string
  img: string
  monthlyPay: number
  annualPay: number
  perYearPay: number
  features: string[]
  current: boolean
}

export type PricingPageFeature = {
  feature: string
  starter: boolean
  pro: boolean
  enterprise: boolean
  addOnAvailable: {
    starter: boolean
    pro: boolean
    enterprise: boolean
  }
}

export type PricingPagePlanButton = {
  variant: 'tonal' | 'contained'
  label: string
  plan: 'starter' | 'pro' | 'enterprise'
}

export type PricingPageFaq = {
  id: string
  question: string
  answer: string
  defaultExpanded?: boolean
}

export type PaymentMethodOption = {
  value: string
  label: string
  img: string
  imgHeightClass: 'bs-3' | 'bs-5'
  isSelected?: boolean
}
