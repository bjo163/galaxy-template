// Component Imports
import ConnectionsView from './ConnectionsView'

// Data Imports
import { getUserViewData } from '@/app/server/actions'

const ConnectionsTab = async () => {
  const userViewData = await getUserViewData()

  return (
    <ConnectionsView
      connectedAccounts={userViewData.connectedAccounts}
      socialAccounts={userViewData.socialAccounts}
    />
  )
}

export default ConnectionsTab
