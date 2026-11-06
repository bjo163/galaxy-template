'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// Types Imports
import type { RatingDistribution } from '@/types/apps/ecommerceTypes'

const TotalReviews = ({ data }: { data: RatingDistribution[] }) => {
  // Hooks
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Card className='bs-full'>
      <CardContent>
        <div className='flex max-sm:flex-col items-center gap-6'>
          <div className='flex flex-col items-start gap-2 is-full sm:is-6/12'>
            <div className='flex items-center gap-2'>
              <Typography variant='h3' color='primary.main'>
                4.89
              </Typography>
              <i className='tabler-star-filled text-[32px] text-primary' />
            </div>
            <Typography className='font-medium' color='text.primary'>
              Total 187 reviews
            </Typography>
            <Typography>All reviews are from genuine customers</Typography>
            <Chip label='+5 This week' variant='tonal' size='small' color='primary' />
          </div>
          <Divider orientation={isSmallScreen ? 'horizontal' : 'vertical'} flexItem />
          <div className='flex flex-col gap-3 is-full sm:is-6/12'>
            {data.map((item, index) => (
              <div key={index} className='flex items-center gap-2'>
                <Typography variant='body2' className='text-nowrap'>
                  {item.rating} Star
                </Typography>
                <LinearProgress
                  color='primary'
                  value={Math.floor((item.value / 185) * 100)}
                  variant='determinate'
                  className='bs-2 is-full'
                />
                <Typography variant='body2'>{item.value}</Typography>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TotalReviews
