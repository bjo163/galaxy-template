'use client'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import type { PricingPlanType } from '@galaxy/types/pages/pricingTypes'

import DialogCloseButton from './DialogCloseButton'
import Pricing from '../pricing/Pricing'

export type PricingDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: PricingPlanType[]
}

const PricingDialog = ({ open, setOpen, data }: PricingDialogProps) => {
  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      open={open}
      onClose={() => setOpen(false)}
      scroll='body'
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogContent className='sm:p-16'>
        <Pricing data={data} />
      </DialogContent>
    </Dialog>
  )
}

export default PricingDialog
