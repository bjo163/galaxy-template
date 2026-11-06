// Component Imports
import ConnectionsView from './ConnectionsView'

// Data Imports
import { getAccountSettingsData } from '@/app/server/actions'

const ConnectionsTab = async () => {
  const data = await getAccountSettingsData()

  return (
    <ConnectionsView
      connectedAccounts={data.connectedAccounts}
      socialAccounts={data.socialAccounts}
    />
  )
}

export default ConnectionsTab
