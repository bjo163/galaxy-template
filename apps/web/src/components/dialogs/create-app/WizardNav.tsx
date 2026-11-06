import type { ReactNode } from 'react'

import Button from '@mui/material/Button'

import { DirectionalIcon } from '@galaxy/ui'

export type WizardNavProps = {
  activeStep: number
  isLastStep?: boolean
  onNext?: () => void
  onPrev?: () => void
  prevLabel?: ReactNode
  nextLabel?: ReactNode
  submitLabel?: ReactNode
  disablePrev?: boolean
  className?: string
}

const WizardNav = ({
  activeStep,
  isLastStep,
  onNext,
  onPrev,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  submitLabel = 'Submit',
  disablePrev,
  className = 'flex items-center justify-between'
}: WizardNavProps) => {
  return (
    <div className={className}>
      <Button
        variant='tonal'
        color='secondary'
        disabled={disablePrev ?? activeStep === 0}
        onClick={onPrev}
        startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
      >
        {prevLabel}
      </Button>
      <Button
        variant='contained'
        color={isLastStep ? 'success' : 'primary'}
        onClick={onNext}
        endIcon={
          isLastStep ? (
            <i className='tabler-check' />
          ) : (
            <DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />
          )
        }
      >
        {isLastStep ? submitLabel : nextLabel}
      </Button>
    </div>
  )
}

export default WizardNav
