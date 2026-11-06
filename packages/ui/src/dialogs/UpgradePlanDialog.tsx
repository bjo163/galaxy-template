'use client'

import { useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'

import ConfirmationDialog from './ConfirmationDialog'
import CustomTextField from '../mui/CustomTextField'
import DialogCloseButton from './DialogCloseButton'

export type UpgradePlanOption = { value: string; label: string }

export type UpgradePlanDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  plans?: UpgradePlanOption[]
  defaultPlan?: string
  currentPlanLabel?: string
  currentPrice?: string
  onUpgrade?: (plan: string) => void
  onCancelSubscription?: (confirmed: boolean) => void
}

const defaultPlans: UpgradePlanOption[] = [
  { value: 'Basic', label: 'Basic - $0/month' },
  { value: 'Standard', label: 'Standard - $99/month' },
  { value: 'Enterprise', label: 'Enterprise - $499/month' },
  { value: 'Company', label: 'Company - $999/month' }
]

const UpgradePlanDialog = ({
  open,
  setOpen,
  plans = defaultPlans,
  defaultPlan = 'Standard',
  currentPlanLabel = 'User current plan is standard plan',
  currentPrice = '99',
  onUpgrade,
  onCancelSubscription
}: UpgradePlanDialogProps) => {
  const [openConfirmation, setOpenConfirmation] = useState(false)

  const handleClose = () => setOpen(false)

  return (
    <>
      <Dialog fullWidth open={open} onClose={handleClose} closeAfterTransition={false} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
        <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
        <DialogTitle variant='h4' className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          Upgrade Plan
          <Typography component='span' className='flex flex-col text-center'>
            Choose the best plan for user
          </Typography>
        </DialogTitle>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16 sm:pbe-16'>
          <form
            className='flex items-end gap-4 flex-col sm:flex-row'
            onSubmit={e => {
              e.preventDefault()
              const select = e.currentTarget.querySelector('input[name="plan"], select') as HTMLInputElement | HTMLSelectElement | null

              onUpgrade?.(select?.value ?? defaultPlan)
            }}
          >
            <CustomTextField select fullWidth label='Choose Plan' name='plan' defaultValue={defaultPlan} id='user-view-plans-select'>
              {plans.map(plan => (
                <MenuItem key={plan.value} value={plan.value}>
                  {plan.label}
                </MenuItem>
              ))}
            </CustomTextField>
            <Button type='submit' variant='contained' className='capitalize max-sm:is-full'>
              Upgrade
            </Button>
          </form>
          <Divider className='mlb-6' />
          <div className='flex flex-col gap-1'>
            <Typography variant='body2'>{currentPlanLabel}</Typography>
            <div className='flex items-center justify-between flex-wrap gap-2'>
              <div className='flex justify-center items-baseline gap-1'>
                <Typography component='sup' className='self-start mbs-3' color='primary.main'>
                  $
                </Typography>
                <Typography component='span' color='primary.main' variant='h1'>
                  {currentPrice}
                </Typography>
                <Typography variant='body2' component='sub' className='self-baseline'>
                  /month
                </Typography>
              </div>
              <Button variant='tonal' className='capitalize' color='error' onClick={() => setOpenConfirmation(true)}>
                Cancel Subscription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog open={openConfirmation} setOpen={setOpenConfirmation} type='unsubscribe' onConfirm={onCancelSubscription} />
    </>
  )
}

export default UpgradePlanDialog
