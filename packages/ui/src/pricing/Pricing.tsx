'use client'

import { useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'

import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import Grid from '@mui/material/Grid'
import { useTheme } from '@mui/material/styles'

import classnames from 'classnames'

import type { PricingPlanType } from '@galaxy/types/pages/pricingTypes'

import DirectionalIcon from '../DirectionalIcon'
import PlanDetails from './PlanDetails'

type Props = {
  data?: PricingPlanType[]
  title?: ReactNode
  description?: ReactNode
  monthlyLabel?: ReactNode
  annuallyLabel?: ReactNode
  saveLabel?: ReactNode
}

const Pricing = (props: Props) => {
  const {
    data,
    title = 'Pricing Plans',
    description = 'All plans include 40+ advanced tools and features to boost your product. Choose the best plan to fit your needs.',
    monthlyLabel = 'Monthly',
    annuallyLabel = 'Annually',
    saveLabel = 'Save up to 10%'
  } = props

  const [pricingPlan, setPricingPlan] = useState<'monthly' | 'annually'>('annually')
  const theme = useTheme()

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setPricingPlan('annually')
    } else {
      setPricingPlan('monthly')
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col justify-center items-center gap-2'>
        <Typography variant='h3'>{title}</Typography>
        <div className='flex items-center text-center flex-col  sm:mbe-[3.8rem]'>
          <Typography>{description}</Typography>
        </div>
        <div className='flex justify-center items-center relative mbs-0.5'>
          <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
            {monthlyLabel}
          </InputLabel>
          <Switch id='pricing-switch' onChange={handleChange} checked={pricingPlan === 'annually'} />
          <InputLabel htmlFor='pricing-switch' className='cursor-pointer'>
            {annuallyLabel}
          </InputLabel>

          <div
            className={classnames('flex absolute max-sm:hidden block-start-[-39px] translate-x-[35%]', {
              'right-full': theme.direction === 'rtl',
              'left-1/2': theme.direction !== 'rtl'
            })}
          >
            <DirectionalIcon
              ltrIconClass='tabler-corner-left-down'
              rtlIconClass='tabler-corner-right-down'
              className='mbs-2 mie-1 text-textDisabled'
            />
            <Chip label={saveLabel} size='small' variant='tonal' color='primary' />
          </div>
        </div>
      </div>
      <Grid container spacing={6}>
        {data?.map((plan, index) => (
          <Grid size={{ xs: 12, md: 4 }} key={index}>
            <PlanDetails data={plan} pricingPlan={pricingPlan} />
          </Grid>
        ))}
      </Grid>
    </div>
  )
}

export default Pricing
