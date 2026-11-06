// React Imports
import type { ReactElement } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { PricingPlanType } from '@/types/pages/pricingTypes'
import type { PaymentMethodCard } from '@/types/apps/userViewTypes'

// Component Imports
import UserLeftOverview from '@views/apps/user/view/user-left-overview'
import UserRight from '@views/apps/user/view/user-right'

// Data Imports
import { getPricingData, getUserViewData } from '@/app/server/actions'

const OverViewTab = dynamic(() => import('@views/apps/user/view/user-right/overview'))
const SecurityTab = dynamic(() => import('@views/apps/user/view/user-right/security'))
const BillingPlans = dynamic(() => import('@views/apps/user/view/user-right/billing-plans'))
const NotificationsTab = dynamic(() => import('@views/apps/user/view/user-right/notifications'))
const ConnectionsTab = dynamic(() => import('@views/apps/user/view/user-right/connections'))

// Vars
const tabContentList = (pricingData?: PricingPlanType[], paymentMethods?: PaymentMethodCard[]): { [key: string]: ReactElement } => ({
  overview: <OverViewTab />,
  security: <SecurityTab />,
  'billing-plans': <BillingPlans data={pricingData} paymentMethods={paymentMethods} />,
  notifications: <NotificationsTab />,
  connections: <ConnectionsTab />
})

/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/pages/pricing` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */

/* const getPricingData = async () => {
  // Vars
  const res = await fetch(`${process.env.API_URL}/pages/pricing`)

  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }

  return res.json()
} */

const UserViewTab = async () => {
  // Vars
  const [pricingData, userViewData] = await Promise.all([getPricingData(), getUserViewData()])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 4, md: 5 }}>
        <UserLeftOverview />
      </Grid>
      <Grid size={{ xs: 12, lg: 8, md: 7 }}>
        <UserRight tabContentList={tabContentList(pricingData, userViewData.paymentMethods)} />
      </Grid>
    </Grid>
  )
}

export default UserViewTab
