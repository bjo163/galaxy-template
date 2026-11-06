'use client'

import { useState } from 'react'

import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import { FormControlLabel } from '@mui/material'

import DialogCloseButton from './DialogCloseButton'
import CustomTextField from '../mui/CustomTextField'

export type EditUserInfoData = {
  firstName?: string
  lastName?: string
  userName?: string
  billingEmail?: string
  status?: string
  taxId?: string
  contact?: string
  language?: string[]
  country?: string
  useAsBillingAddress?: boolean
}

export type EditUserInfoDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: EditUserInfoData
  statuses?: string[]
  languages?: string[]
  countries?: string[]
  onSubmit?: (data: EditUserInfoData) => void
}

const initialData: EditUserInfoData = {
  firstName: 'Oliver',
  lastName: 'Queen',
  userName: 'oliverQueen',
  billingEmail: 'oliverQueen@gmail.com',
  status: 'active',
  taxId: 'Tax-8894',
  contact: '+ 1 609 933 4422',
  language: ['English'],
  country: 'US',
  useAsBillingAddress: true
}

const defaultStatuses = ['Status', 'Active', 'Inactive', 'Suspended']
const defaultLanguages = ['English', 'Spanish', 'French', 'German', 'Hindi']
const defaultCountries = ['Select Country', 'France', 'Russia', 'China', 'UK', 'US']

const EditUserInfoDialog = ({
  open,
  setOpen,
  data,
  statuses = defaultStatuses,
  languages = defaultLanguages,
  countries = defaultCountries,
  onSubmit
}: EditUserInfoDialogProps) => {
  const [userData, setUserData] = useState<EditUserInfoData>(data || initialData)

  const handleClose = () => {
    setOpen(false)
    setUserData(data || initialData)
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleClose}
      maxWidth='md'
      scroll='body'
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Edit User Information
        <Typography component='span' className='flex flex-col text-center'>
          Updating user details will receive a privacy audit.
        </Typography>
      </DialogTitle>
      <form
        onSubmit={e => {
          e.preventDefault()
          onSubmit?.(userData)
          handleClose()
        }}
      >
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='First Name'
                placeholder='John'
                value={userData?.firstName}
                onChange={e => setUserData({ ...userData, firstName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Last Name'
                placeholder='Doe'
                value={userData?.lastName}
                onChange={e => setUserData({ ...userData, lastName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='User Name'
                placeholder='JohnDoe'
                value={userData?.userName}
                onChange={e => setUserData({ ...userData, userName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Billing Email'
                placeholder='johnDoe@email.com'
                value={userData?.billingEmail}
                onChange={e => setUserData({ ...userData, billingEmail: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label='Status'
                value={userData?.status}
                onChange={e => setUserData({ ...userData, status: e.target.value as string })}
              >
                {statuses.map((status, index) => (
                  <MenuItem key={index} value={index === 0 ? '' : status.toLowerCase().replace(/\s+/g, '-')}>
                    {status}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Tax ID'
                placeholder='Tax-7490'
                value={userData?.taxId}
                onChange={e => setUserData({ ...userData, taxId: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Contact'
                placeholder='+ 123 456 7890'
                value={userData?.contact}
                onChange={e => setUserData({ ...userData, contact: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label='Language'
                value={userData?.language?.map(lang => lang.toLowerCase().replace(/\s+/g, '-')) || []}
                slotProps={{
                  select: {
                    multiple: true,
                    onChange: e => setUserData({ ...userData, language: e.target.value as string[] }),
                    renderValue: selected => (
                      <div className='flex items-center gap-2'>
                        {(selected as string[]).map(value => (
                          <Chip key={value} label={value} className='capitalize' size='small' />
                        ))}
                      </div>
                    )
                  }
                }}
              >
                {languages.map((language, index) => (
                  <MenuItem key={index} value={language.toLowerCase().replace(/\s+/g, '-')}>
                    {language}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                select
                fullWidth
                label='Country'
                value={userData?.country?.toLowerCase().replace(/\s+/g, '-')}
                onChange={e => setUserData({ ...userData, country: e.target.value as string })}
              >
                {countries.map((country, index) => (
                  <MenuItem key={index} value={index === 0 ? '' : country.toLowerCase().replace(/\s+/g, '-')}>
                    {country}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch defaultChecked={userData?.useAsBillingAddress} onChange={e => setUserData({ ...userData, useAsBillingAddress: e.target.checked })} />}
                label='Use as a billing address?'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit'>
            Submit
          </Button>
          <Button variant='tonal' color='secondary' type='reset' onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default EditUserInfoDialog
