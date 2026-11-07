// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import { CustomAvatar } from '@galaxy/ui'

import { OptionMenu } from '@galaxy/ui'

// Types Imports
import type { ThemeColor } from '@core/types'

import type { DeliveryPerformanceItem } from '@galaxy/types/apps/logisticsTypes'

type dataTypes = DeliveryPerformanceItem

const LogisticsDeliveryPerformance = ({ data }: { data: dataTypes[] }) => {
  return (
    <Card>
      <CardHeader
        title='Delivery Performance'
        subheader='12% increase in this month'
        action={<OptionMenu options={['Select All', 'Refresh', 'Share']} />}
      />
      <CardContent className='flex flex-col gap-[30px]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <CustomAvatar skin='light' color={item.color} variant='rounded' size={38}>
              <i className={classnames(item.icon, 'text-[26px]')} />
            </CustomAvatar>
            <div className='flex justify-between items-center gap-4 is-full'>
              <div>
                <Typography color='text.primary' className='line-clamp-1'>
                  {item.title}
                </Typography>
                <div className='flex items-center gap-1'>
                  <i
                    className={classnames(
                      'text-xl',
                      item.change > 0 ? 'tabler-chevron-up text-success' : 'tabler-chevron-down text-error'
                    )}
                  />
                  <Typography variant='body2' color={item.change > 0 ? 'success.main' : 'error.main'}>
                    {item.change}%
                  </Typography>
                </div>
              </div>
              <Typography color='text.primary' className='font-medium'>
                {item.value}
              </Typography>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default LogisticsDeliveryPerformance
