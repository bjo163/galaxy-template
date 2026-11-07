// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

// Type Imports
import { CustomAvatar } from '@galaxy/ui'

import type { ThemeColor } from '@core/types'

// Component Imports
type DataType = {
  icon: string
  stats: string
  title: string
  color: ThemeColor
}

const StatisticsCard = ({ data }: { data: DataType[] }) => {
  return (
    <Card>
      <CardHeader
        title='Statistics'
        action={
          <Typography variant='subtitle2' color='text.disabled'>
            Updated 1 month ago
          </Typography>
        }
      />
      <CardContent className='flex justify-between flex-wrap gap-4'>
        <Grid container spacing={4} flex={1}>
          {data.map((item, index) => (
            <Grid size={{ xs: 6, md: 3 }} key={index} className='flex gap-4 items-center'>
              <CustomAvatar color={item.color} variant='rounded' size={40} skin='light'>
                <i className={item.icon}></i>
              </CustomAvatar>
              <div>
                <Typography variant='h5'>{item.stats}</Typography>
                <Typography variant='body2'>{item.title}</Typography>
              </div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default StatisticsCard
