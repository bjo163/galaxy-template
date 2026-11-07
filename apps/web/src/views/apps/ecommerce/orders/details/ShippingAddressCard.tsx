// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import type { TypographyProps } from '@mui/material/Typography'

// Type Imports
import type { ThemeColor } from '@core/types'

import { db as ecommerceData } from '@galaxy/fake-db/apps/ecommerce'

import type { AddressData } from '@/types/apps/ecommerceTypes'

// Component Imports
import { AddEditAddressDialog, OpenDialogOnElementClick } from '@galaxy/ui'

// Vars

const ShippingAddress = () => {
  // Vars
  const typographyProps = (children: string, color: ThemeColor, className: string): TypographyProps => ({
    children,
    color,
    className
  })

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='flex justify-between items-center'>
          <Typography variant='h5'>Shipping Address</Typography>
          <OpenDialogOnElementClick
            element={Typography}
            elementProps={typographyProps('Edit', 'primary', 'cursor-pointer font-medium')}
            dialog={AddEditAddressDialog}
            dialogProps={{ type: 'Add address for billing address', data: ecommerceData.shippingAddress as AddressData }}
          />
        </div>
        <div className='flex flex-col'>
          <Typography>45 Roker Terrace</Typography>
          <Typography>Latheronwheel</Typography>
          <Typography>KW5 8NW, London</Typography>
          <Typography>UK</Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default ShippingAddress
