// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import type { TypographyProps } from '@mui/material/Typography'

// Type Imports
import { getInitials } from '@galaxy/utils'

import { db as ecommerceData } from '@galaxy/fake-db/apps/ecommerce'

import { CustomAvatar } from '@galaxy/ui'

import type { ThemeColor } from '@core/types'
import type { OrderType, UserDialogData } from '@/types/apps/ecommerceTypes'

// Component Imports
import { EditUserInfoDialog, OpenDialogOnElementClick } from '@galaxy/ui'

// Util Imports

const getAvatar = (params: Pick<OrderType, 'avatar' | 'customer'>) => {
  const { avatar, customer } = params

  if (avatar) {
    return <Avatar src={avatar} />
  } else {
    return <Avatar>{getInitials(customer as string)}</Avatar>
  }
}

const CustomerDetails = ({ orderData }: { orderData?: OrderType }) => {
  // Vars
  const typographyProps = (children: string, color: ThemeColor, className: string): TypographyProps => ({
    children,
    color,
    className
  })

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <Typography variant='h5'>Customer details</Typography>
        <div className='flex items-center gap-3'>
          {getAvatar({ avatar: orderData?.avatar ?? '', customer: orderData?.customer ?? '' })}
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {orderData?.customer}
            </Typography>
            <Typography>Customer ID: #47389</Typography>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <CustomAvatar skin='light' color='success' size={40}>
            <i className='tabler-shopping-cart' />
          </CustomAvatar>
          <Typography color='text.primary' className='font-medium'>
            12 Orders
          </Typography>
        </div>
        <div className='flex flex-col gap-1'>
          <div className='flex justify-between items-center'>
            <Typography color='text.primary' className='font-medium'>
              Contact info
            </Typography>
            <OpenDialogOnElementClick
              element={Typography}
              elementProps={typographyProps('Edit', 'primary', 'cursor-pointer font-medium')}
              dialog={EditUserInfoDialog}
              dialogProps={{ data: ecommerceData.userDialogData as UserDialogData }}
            />
          </div>
          <Typography>Email: {orderData?.email}</Typography>
          <Typography>Mobile: +1 (609) 972-22-22</Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomerDetails
