'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'

import Radio from '@mui/material/Radio'
import Typography from '@mui/material/Typography'
import { CustomAvatar, CustomTextField } from '@galaxy/ui'

import WizardNav from './WizardNav'

type Props = { activeStep: number; isLastStep: boolean; handleNext: () => void; handlePrev: () => void; appNamePlaceholder?: string }

const Details = ({ activeStep, isLastStep, handleNext, handlePrev, appNamePlaceholder = 'Galaxy' }: Props) => {
  const [value, setValue] = useState<string>('crm')
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)

  return (
    <div className='flex flex-col gap-6'>
      <CustomTextField fullWidth label='Application Name' placeholder={appNamePlaceholder} />
      <div className='flex flex-col gap-4'>
        <Typography variant='h5'>Category</Typography>
        <div onClick={() => setValue('crm')} className='flex items-center justify-between cursor-pointer gap-4'>
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' color='info' variant='rounded' size={46}><i className='tabler-file-text text-3xl' /></CustomAvatar>
            <div className='flex flex-col gap-1'><Typography color='text.primary' className='font-medium'>CRM Application</Typography><Typography variant='body2'>Scales with any business</Typography></div>
          </div>
          <Radio value='crm' onChange={handleChange} checked={value === 'crm'} />
        </div>
        <div onClick={() => setValue('eCommerce')} className='flex items-center justify-between cursor-pointer gap-4'>
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' color='success' variant='rounded' size={46}><i className='tabler-shopping-cart text-3xl' /></CustomAvatar>
            <div className='flex flex-col gap-1'><Typography color='text.primary' className='font-medium'>eCommerce Platforms</Typography><Typography variant='body2'>Grow Your Business With App</Typography></div>
          </div>
          <Radio value='eCommerce' onChange={handleChange} checked={value === 'eCommerce'} />
        </div>
        <div onClick={() => setValue('learning')} className='flex items-center justify-between cursor-pointer gap-4'>
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' color='error' variant='rounded' size={46}><i className='tabler-device-laptop text-3xl' /></CustomAvatar>
            <div className='flex flex-col gap-1'><Typography color='text.primary' className='font-medium'>Online Learning platform</Typography><Typography variant='body2'>Start learning today</Typography></div>
          </div>
          <Radio value='learning' onChange={handleChange} checked={value === 'learning'} />
        </div>
      </div>
      <WizardNav activeStep={activeStep} isLastStep={isLastStep} onNext={handleNext} onPrev={handlePrev} />
    </div>
  )
}

export default Details
