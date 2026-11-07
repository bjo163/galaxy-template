// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

import { CustomAvatar } from '@galaxy/ui'

import type { MonthlyCampaignState as MonthlyCampaignStateType } from '@/types/apps/dashboardTypes'

// Components Imports
import { OptionMenu } from '@galaxy/ui'

const MonthlyCampaignState = ({ data }: { data: MonthlyCampaignStateType[] }) => {
  return (
    <Card>
      <CardHeader
        title='Monthly Campaign State'
        subheader='8.52k Social Visitors'
        action={<OptionMenu options={['Last Month', 'Last 6 Months', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-[1.5625rem]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <CustomAvatar skin='light' variant='rounded' color={item.avatarColor} size={34}>
              <i className={classnames(item.icon, 'text-[22px]')} />
            </CustomAvatar>
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <Typography className='font-medium' color='text.primary'>
                {item.title}
              </Typography>
              <div className='flex items-center gap-4'>
                <Typography>{item.amount}</Typography>
                <Typography
                  className='flex justify-end is-11'
                  color={`${item.trend === 'negative' ? 'error' : 'success'}.main`}
                >
                  {item.trendNumber}
                </Typography>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default MonthlyCampaignState
