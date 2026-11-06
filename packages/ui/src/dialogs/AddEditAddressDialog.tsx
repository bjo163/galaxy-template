'use client'

import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

import classnames from 'classnames'

import CustomInputVertical from '../custom-inputs/Vertical'
import type { CustomInputVerticalData } from '../custom-inputs/types'
import DialogCloseButton from './DialogCloseButton'
import CustomTextField from '../mui/CustomTextField'

export type AddEditAddressData = {
  firstName?: string
  lastName?: string
  country?: string
  address1?: string
  address2?: string
  landmark?: string
  city?: string
  state?: string
  zipCode?: string
  addressType?: string
  useAsBilling?: boolean
}

export type AddEditAddressDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: AddEditAddressData
  countries?: string[]
  addressTypes?: CustomInputVerticalData[]
  onSubmit?: (data: AddEditAddressData) => void
}

const defaultCountries = ['Select Country', 'France', 'Russia', 'China', 'UK', 'US']

const initialAddressData: AddEditAddressData = {
  firstName: '',
  lastName: '',
  country: '',
  address1: '',
  address2: '',
  landmark: '',
  city: '',
  state: '',
  zipCode: '',
  useAsBilling: true
}

const defaultAddressTypes: CustomInputVerticalData[] = [
  { title: 'Home', content: 'Delivery Time (7am - 9pm)', value: 'home', isSelected: true, asset: 'tabler-home' },
  { title: 'Office', content: 'Delivery Time (10am - 6pm)', value: 'office', asset: 'tabler-building-skyscraper' }
]

const AddEditAddressDialog = ({
  open,
  setOpen,
  data,
  countries = defaultCountries,
  addressTypes = defaultAddressTypes,
  onSubmit
}: AddEditAddressDialogProps) => {
  const initialSelected: string = addressTypes?.find(item => item.isSelected)?.value || ''
  const [selected, setSelected] = useState<string>(initialSelected)
  const [addressData, setAddressData] = useState<AddEditAddressData>(initialAddressData)

  const handleChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    if (typeof prop === 'string') {
      setSelected(prop)
    } else {
      setSelected((prop.target as HTMLInputElement).value)
    }
  }

  useEffect(() => {
    setAddressData(data ?? initialAddressData)
    setSelected(data?.addressType ?? initialSelected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data])

  return (
    <Dialog
      open={open}
      maxWidth='md'
      scroll='body'
      onClose={() => {
        setOpen(false)
        setSelected(initialSelected)
      }}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {data ? 'Edit Address' : 'Add New Address'}
        <Typography component='span' className='flex flex-col text-center'>
          {data ? 'Edit Address for future billing' : 'Add address for billing address'}
        </Typography>
      </DialogTitle>
      <form
        onSubmit={e => {
          e.preventDefault()
          onSubmit?.({ ...addressData, addressType: selected })
          setOpen(false)
        }}
      >
        <DialogContent className='pbs-0 sm:pli-16'>
          <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
          <Grid container spacing={6}>
            {addressTypes.map((item, index) => {
              let asset

              if (item.asset && typeof item.asset === 'string') {
                asset = <i className={classnames(item.asset, 'text-[28px]')} />
              }

              return (
                <Grid size={{ xs: 12, sm: 6 }} key={index}>
                  <CustomInputVertical
                    type='radio'
                    key={index}
                    data={{ ...item, asset }}
                    selected={selected}
                    name='addressType'
                    handleChange={handleChange}
                  />
                </Grid>
              )
            })}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='First Name'
                name='firstName'
                variant='outlined'
                placeholder='John'
                value={addressData?.firstName}
                onChange={e => setAddressData({ ...addressData, firstName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Last Name'
                name='lastName'
                variant='outlined'
                placeholder='Doe'
                value={addressData?.lastName}
                onChange={e => setAddressData({ ...addressData, lastName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                label='Country'
                name='country'
                variant='outlined'
                value={addressData?.country?.toLowerCase().replace(/\s+/g, '-') || ''}
                onChange={e => setAddressData({ ...addressData, country: e.target.value })}
              >
                {countries.map((item, index) => (
                  <MenuItem key={index} value={index === 0 ? '' : item.toLowerCase().replace(/\s+/g, '-')}>
                    {item}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Address Line 1'
                name='address1'
                variant='outlined'
                placeholder='12, Business Park'
                value={addressData?.address1}
                onChange={e => setAddressData({ ...addressData, address1: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Address Line 2'
                name='address2'
                variant='outlined'
                placeholder='Mall Road'
                value={addressData?.address2}
                onChange={e => setAddressData({ ...addressData, address2: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Landmark'
                name='landmark'
                variant='outlined'
                placeholder='Nr. Hard Rock Cafe'
                value={addressData?.landmark}
                onChange={e => setAddressData({ ...addressData, landmark: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='City'
                name='city'
                variant='outlined'
                placeholder='Los Angeles'
                value={addressData?.city}
                onChange={e => setAddressData({ ...addressData, city: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='State'
                name='state'
                variant='outlined'
                placeholder='California'
                value={addressData?.state}
                onChange={e => setAddressData({ ...addressData, state: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Zip Code'
                type='number'
                name='zipCode'
                variant='outlined'
                placeholder='99950'
                value={addressData?.zipCode}
                onChange={e => setAddressData({ ...addressData, zipCode: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={addressData?.useAsBilling ?? true}
                    onChange={e => setAddressData({ ...addressData, useAsBilling: e.target.checked })}
                  />
                }
                label='Make this default shipping address'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit'>
            {data ? 'Update' : 'Submit'}
          </Button>
          <Button
            variant='tonal'
            color='secondary'
            onClick={() => {
              setOpen(false)
              setSelected(initialSelected)
            }}
            type='reset'
          >
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AddEditAddressDialog
