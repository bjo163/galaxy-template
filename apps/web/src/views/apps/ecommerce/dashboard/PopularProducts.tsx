// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Components Imports
import { OptionMenu } from '@galaxy/ui'

// Type Imports
import type { EcommercePopularProduct } from '@/types/apps/ecommerceDashboardTypes'

const PopularProducts = ({ data }: { data: EcommercePopularProduct[] }) => {
  return (
    <Card>
      <CardHeader
        title='Popular Products'
        subheader='Total 10.4k Visitors'
        action={<OptionMenu options={['Price - low to high', 'Price - high to low', 'Best seller']} />}
      />
      <CardContent className='flex flex-col gap-[1.638rem]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <img src={item.imgSrc} alt={item.title} width={46} />
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{`Item: #FXZ-${item.subtitle}`}</Typography>
              </div>
              <Typography>{item.amount}</Typography>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default PopularProducts
