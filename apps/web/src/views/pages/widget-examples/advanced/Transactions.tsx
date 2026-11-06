// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

import { CustomAvatar } from '@galaxy/ui'

// Components Imports
import OptionMenu from '@core/components/option-menu'

import type { WidgetTransaction } from '@/types/pages/widgetExamplesAdvancedTypes'

const Transactions = ({ data }: { data: WidgetTransaction[] }) => {
  return (
    <Card>
      <CardHeader
        title='Transactions'
        subheader='Total 58 transaction done in month'
        action={<OptionMenu options={['Refresh', 'Show all entries', 'Make payment']} />}
      />
      <CardContent className='flex flex-col gap-[1.125rem]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <CustomAvatar skin='light' variant='rounded' color={item.avatarColor} size={34}>
              <i className={classnames(item.avatarIcon, 'text-[22px]')} />
            </CustomAvatar>
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <Typography
                variant='h6'
                color={`${item.amountDiff === 'negative' ? 'error' : 'success'}.main`}
              >{`${item.amountDiff === 'negative' ? '-' : '+'}${item.amount}`}</Typography>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default Transactions
