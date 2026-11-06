// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { userListCards } from '@galaxy/fake-db/apps/userListCards'

import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import UserListTable from './UserListTable'
import UserListCards from './UserListCards'

const UserList = ({ userData, cardsData }: { userData?: UsersType[]; cardsData: typeof userListCards }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <UserListCards data={cardsData} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <UserListTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserList
