/**
 * Canonical plan card used by ecommerce settings (subscription management)
 * and the account-settings billing-plans tab.
 *
 * NOTE: This is intentionally separate from `LandingPricingPlan` (front-pages marketing)
 * and `PricingPageFeature` (comparison matrix). Each serves a distinct presentation model;
 * see docs/superpowers/plans/ §14 open-question-6 decision: "separate domains".
 */
export type PricingPlanType = {
  title: string
  imgSrc: string
  subtitle: string
  imgWidth?: number
  imgHeight?: number
  currentPlan: boolean
  popularPlan: boolean
  monthlyPrice: number
  planBenefits: string[]
  yearlyPlan: {
    monthly: number
    annually: number
  }
}
