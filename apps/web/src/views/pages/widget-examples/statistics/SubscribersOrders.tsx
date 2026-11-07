// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Progress from '@mui/material/LinearProgress'

// Types Imports
import type { SubscribersOrdersProps } from '@/types/pages/widgetTypes'

// Component Imports
import { OptionMenu } from '@galaxy/ui'

const SubscribersOrders = ({ data }: { data: SubscribersOrdersProps[] }) => {
  return (
    <Card>
      <CardHeader title='Statistics' action={<OptionMenu options={['Refresh', 'Share', 'Update']} />} />
      <CardContent className='flex flex-col gap-y-6'>
        {data.map((item, index) => (
          <div key={index} className='flex flex-col gap-2'>
            <div className='flex items-center justify-between gap-3'>
              <Typography variant='h6'>{item.title}</Typography>
              <Chip variant='tonal' label={item.chipText} size='small' color={item.chipColor} />
            </div>
            <div>
              <div className='flex items-center justify-between gap-3'>
                <Typography>{item.subtitle}</Typography>
                <Typography variant='body2' color='text.disabled'>
                  {item.progress}%
                </Typography>
              </div>
              <Progress variant='determinate' value={item.progress} className='bs-2 mbs-1' color={item.progressColor} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default SubscribersOrders
