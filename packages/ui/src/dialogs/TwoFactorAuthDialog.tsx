'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

import CustomInputHorizontal from '../custom-inputs/Horizontal'
import type { CustomInputHorizontalData } from '../custom-inputs/types'
import DialogCloseButton from './DialogCloseButton'
import CustomTextField from '../mui/CustomTextField'

export type TwoFactorAuthDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  methods?: CustomInputHorizontalData[]
  qrCodeSrc?: string
  onSubmit?: (method: string, code?: string) => void
}

const defaultMethods: CustomInputHorizontalData[] = [
  {
    title: 'Authenticator Apps',
    value: 'app',
    isSelected: true,
    content: 'Get code from an app like Google Authenticator or Microsoft Authenticator.'
  },
  {
    title: 'SMS',
    value: 'sms',
    content: 'We will send a code via SMS if you need to use your backup login method.'
  }
]

const TwoFactorAuthDialog = ({ open, setOpen, methods = defaultMethods, qrCodeSrc = '/images/misc/barcode.png', onSubmit }: TwoFactorAuthDialogProps) => {
  const initialSelectedOption: string =
    methods.filter(item => item.isSelected)[methods.filter(item => item.isSelected).length - 1]?.value ?? 'app'

  const [authType, setAuthType] = useState<string>(initialSelectedOption)
  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false)

  const handleClose = () => {
    setOpen(false)
    if (authType !== 'app') setAuthType('app')
  }

  const handleAuthDialogClose = () => {
    setShowAuthDialog(false)

    if (authType !== 'app') {
      setTimeout(() => {
        setAuthType('app')
      }, 250)
    }
  }

  const handleOptionChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    if (typeof prop === 'string') {
      setAuthType(prop)
    } else {
      setAuthType((prop.target as HTMLInputElement).value)
    }
  }

  return (
    <>
      <Dialog
        fullWidth
        maxWidth='md'
        scroll='body'
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogCloseButton onClick={handleClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
        <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          Select Authentication Method
          <Typography component='span' className='flex flex-col text-center'>
            You also need to select a method by which the proxy authenticates to the directory serve.
          </Typography>
        </DialogTitle>
        <DialogContent className='pbs-0 sm:pli-16'>
          <Grid container spacing={6}>
            {methods.map((item, index) => (
              <CustomInputHorizontal
                type='radio'
                key={index}
                selected={authType}
                handleChange={handleOptionChange}
                data={item}
                gridProps={{ size: { xs: 12 } }}
                name='auth-method'
              />
            ))}
          </Grid>
        </DialogContent>
        <DialogActions className='pbs-0 sm:pbe-16 sm:pli-16 flex justify-center'>
          <Button
            variant='contained'
            onClick={() => {
              setOpen(false)
              setShowAuthDialog(true)
            }}
            className='capitalize'
          >
            Continue
          </Button>
          <Button variant='tonal' color='secondary' onClick={handleClose} className='capitalize'>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth='md'
        scroll='body'
        open={showAuthDialog}
        onClose={handleAuthDialogClose}
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogCloseButton onClick={handleAuthDialogClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
        <form
          onSubmit={e => {
            e.preventDefault()
            const form = e.currentTarget
            const input = form.querySelector('input') as HTMLInputElement | null

            onSubmit?.(authType, input?.value)
            handleAuthDialogClose()
          }}
        >
          {authType === 'sms' ? (
            <>
              <DialogTitle variant='h5' className='flex flex-col gap-2 sm:pbs-16 sm:pbe-6 sm:pli-16'>
                Verify Your Mobile Number for SMS
                <Typography component='span' className='flex flex-col'>
                  Enter your mobile phone number with country code and we will send you a verification code.
                </Typography>
              </DialogTitle>
              <DialogContent className='overflow-visible pbs-0 sm:pbe-16 sm:pli-16'>
                <CustomTextField fullWidth type='number' name='phone' label='Mobile Number' placeholder='123 456 7890' />
              </DialogContent>
              <DialogActions className='pbs-0 sm:pbe-16 sm:pli-16'>
                <Button variant='tonal' type='reset' color='secondary' onClick={handleAuthDialogClose}>
                  Cancel
                </Button>
                <Button color='success' variant='contained' type='submit' endIcon={<i className='tabler-check' />}>
                  Submit
                </Button>
              </DialogActions>
            </>
          ) : (
            <>
              <DialogTitle variant='h4' className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
                Add Authenticator App
              </DialogTitle>
              <DialogContent className='flex flex-col gap-6 pbs-0 sm:pli-16'>
                <div className='flex flex-col gap-2'>
                  <Typography variant='h5'>Authenticator Apps</Typography>
                  <Typography>
                    Using an authenticator app like Google Authenticator, Microsoft Authenticator, Authy, or 1Password, scan the
                    QR code. It will generate a 6 digit code for you to enter below.
                  </Typography>
                </div>
                <div className='flex justify-center'>
                  <img alt='qr-code' height={150} width={150} src={qrCodeSrc} />
                </div>
                <div className='flex flex-col gap-4'>
                  <Alert severity='warning' icon={false}>
                    <AlertTitle>ASDLKNASDA9AHS678dGhASD78AB</AlertTitle>
                    If you having trouble using the QR code, select manual entry on your app
                  </Alert>
                  <CustomTextField fullWidth name='code' label='Enter Authentication Code' placeholder='Enter Authentication Code' />
                </div>
              </DialogContent>
              <DialogActions className='pbs-0 sm:pbe-16 sm:pli-16'>
                <Button variant='tonal' type='reset' color='secondary' onClick={handleAuthDialogClose}>
                  Cancel
                </Button>
                <Button color='success' variant='contained' type='submit' endIcon={<i className='tabler-check' />}>
                  Submit
                </Button>
              </DialogActions>
            </>
          )}
        </form>
      </Dialog>
    </>
  )
}

export default TwoFactorAuthDialog
