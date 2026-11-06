'use client'

import Typography from '@mui/material/Typography'

import WizardNav from './WizardNav'

type Props = { activeStep: number; isLastStep: boolean; handleNext: () => void; handlePrev: () => void }

const Submit = ({ activeStep, isLastStep, handleNext, handlePrev }: Props) => {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-center gap-4'>
        <div className='flex flex-col items-center gap-1'>
          <Typography variant='h5'>Submit</Typography>
          <Typography variant='body2'>Submit to kickstart your project.</Typography>
        </div>
        <img alt='submit-img' src='/images/illustrations/characters/4.png' height={200} width={176} />
      </div>
      <WizardNav activeStep={activeStep} isLastStep={isLastStep} onNext={handleNext} onPrev={handlePrev} />
    </div>
  )
}

export default Submit
