// Next Imports
import Link from 'next/link'

// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Component imports
import BasicDataTables from '@views/react-table/BasicDataTables'
import EditableDataTables from '@views/react-table/EditableDataTables'
import ColumnVisibility from '@views/react-table/ColumnVisibility'
import RowSelection from '@views/react-table/RowSelection'
import KitchenSink from '@views/react-table/KitchenSink'

// Data Imports
import { getReactTableData } from '@/app/server/actions'

const Tables = async () => {
  // Vars
  const reactTableData = await getReactTableData()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>React Table</Typography>
        <Typography>
          <code>@tanstack/react-table</code> is a third-party library. Please refer to its{' '}
          <Link
            href='https://tanstack.com/table'
            target='_blank'
            rel='noopener noreferrer'
            className='no-underline text-primary'
          >
            official documentation
          </Link>{' '}
          for more details.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <BasicDataTables data={reactTableData} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <EditableDataTables data={reactTableData} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ColumnVisibility data={reactTableData} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <RowSelection data={reactTableData} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <KitchenSink data={reactTableData} />
      </Grid>
    </Grid>
  )
}

export default Tables
