// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import { OptionMenu } from '@galaxy/ui'

import type { SalesByCountry } from '@/types/apps/dashboardTypes'

// Components Imports

const SalesByCountries = ({ data }: { data: SalesByCountry[] }) => {
  return (
    <Card>
      <CardHeader
        title='Sales by Countries'
        subheader='Monthly Sales Overview'
        action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-[1.0875rem]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <img src={item.imgSrc} alt={item.subtitle} width={34} />
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <div className='flex items-center gap-1'>
                <i
                  className={classnames(
                    item.trend === 'negative' ? 'tabler-chevron-down text-error' : 'tabler-chevron-up text-success',
                    'text-xl'
                  )}
                />
                <Typography
                  variant='h6'
                  color={`${item.trend === 'negative' ? 'error' : 'success'}.main`}
                >{`${item.trendNumber}%`}</Typography>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default SalesByCountries
