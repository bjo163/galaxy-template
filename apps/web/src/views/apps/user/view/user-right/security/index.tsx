// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ChangePassword from './ChangePassword'
import TwoStepVerification from './TwoStepVerification'
import RecentDevice from './RecentDevice'

// Data Imports
import { getUserViewData } from '@/app/server/actions'

const SecurityTab = async () => {
  const userViewData = await getUserViewData()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ChangePassword />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TwoStepVerification />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <RecentDevice data={userViewData.recentDevices} />
      </Grid>
    </Grid>
  )
}

export default SecurityTab
