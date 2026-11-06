// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { PricingPlanType } from '@/types/pages/pricingTypes'
import type { PaymentMethodCard } from '@/types/apps/userViewTypes'

// Component Imports
import CurrentPlan from './CurrentPlan'
import PaymentMethod from './PaymentMethod'
import BillingAddress from './BillingAddress'

const BillingPlans = ({
  data,
  paymentMethods
}: {
  data?: PricingPlanType[]
  paymentMethods?: PaymentMethodCard[]
}) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <CurrentPlan data={data} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <PaymentMethod data={paymentMethods} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <BillingAddress />
      </Grid>
    </Grid>
  )
}

export default BillingPlans
