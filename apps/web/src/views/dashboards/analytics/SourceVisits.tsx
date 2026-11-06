// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SourceVisit } from '@/types/apps/dashboardTypes'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

const SourceVisits = ({ data }: { data: SourceVisit[] }) => {
  return (
    <Card>
      <CardHeader
        title='Source Visits'
        subheader='38.4k Visitors'
        action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-6 md:gap-[1.0875rem] lg:gap-[1.5875rem]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <CustomAvatar skin='light' variant='rounded' size={34}>
              <i className={classnames(item.icon, 'text-[22px] text-textSecondary')} />
            </CustomAvatar>
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <div className='flex items-center gap-4'>
                <Typography>{item.amount}</Typography>
                <Chip
                  variant='tonal'
                  size='small'
                  color={item.trend === 'negative' ? 'error' : 'success'}
                  label={`${item.trend === 'negative' ? '-' : '+'}${item.trendNumber}%`}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default SourceVisits
