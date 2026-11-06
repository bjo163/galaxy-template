// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ChangePasswordCard from './ChangePasswordCard'
import TwoFactorAuthenticationCard from './TwoFactorAuthenticationCard'
import CreateApiKey from './CreateApiKey'
import ApiKeyList from './ApiKeyList'
import RecentDevicesTable from './RecentDevicesTable'

// Data Imports
import { getAccountSettingsData } from '@/app/server/actions'

const Security = async () => {
  const data = await getAccountSettingsData()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ChangePasswordCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TwoFactorAuthenticationCard />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CreateApiKey />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ApiKeyList data={data.apiKeys} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <RecentDevicesTable data={data.recentDevices} />
      </Grid>
    </Grid>
  )
}

export default Security
