// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { userListCards } from '@galaxy/fake-db/apps/userListCards'

// Component Imports
import HorizontalWithSubtitle from '@components/card-statistics/HorizontalWithSubtitle'

const UserListCards = ({ data }: { data: typeof userListCards }) => {
  return (
    <Grid container spacing={6}>
      {data.map((item, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
          <HorizontalWithSubtitle {...item} />
        </Grid>
      ))}
    </Grid>
  )
}

export default UserListCards
