'use client'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

import CustomTextField from '../mui/CustomTextField'
import DialogCloseButton from './DialogCloseButton'

export type PermissionDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: string
  onSubmit?: (name: string, core: boolean) => void
}

type EditProps = {
  handleClose: () => void
  data: string
  onSubmit?: (name: string, core: boolean) => void
}

const AddContent = ({ handleClose, onSubmit }: { handleClose: () => void; onSubmit?: (name: string, core: boolean) => void }) => {
  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        const form = e.currentTarget
        const input = form.querySelector('input[name="permissionName"]') as HTMLInputElement | null
        const core = form.querySelector('input[name="corePermission"]') as HTMLInputElement | null

        onSubmit?.(input?.value ?? '', !!core?.checked)
        handleClose()
      }}
    >
      <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <CustomTextField
          fullWidth
          name='permissionName'
          label='Permission Name'
          variant='outlined'
          placeholder='Enter Permission Name'
          className='mbe-2'
        />
        <FormControlLabel control={<Checkbox name='corePermission' />} label='Set as core permission' />
      </DialogContent>
      <DialogActions className='flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16'>
        <Button type='submit' variant='contained'>
          Create Permission
        </Button>
        <Button onClick={handleClose} variant='tonal' color='secondary' className='max-sm:mis-0'>
          Discard
        </Button>
      </DialogActions>
    </form>
  )
}

const EditContent = ({ handleClose, data, onSubmit }: EditProps) => {
  return (
    <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
      <Alert severity='warning' className='mbe-8'>
        <AlertTitle>Warning!</AlertTitle>
        By editing the permission name, you might break the system permissions functionality. Please ensure you&#39;re
        absolutely certain before proceeding.
      </Alert>
      <form
        className='flex items-end gap-4 mbe-2'
        onSubmit={e => {
          e.preventDefault()
          const form = e.currentTarget
          const input = form.querySelector('input[name="permissionName"]') as HTMLInputElement | null

          onSubmit?.(input?.value ?? '', false)
          handleClose()
        }}
      >
        <CustomTextField
          fullWidth
          size='small'
          name='permissionName'
          defaultValue={data}
          variant='outlined'
          label='Permission Name'
          placeholder='Enter Permission Name'
        />
        <Button variant='contained' type='submit'>
          Update
        </Button>
      </form>
      <FormControlLabel control={<Checkbox name='corePermission' />} label='Set as core permission' />
    </DialogContent>
  )
}

const PermissionDialog = ({ open, setOpen, data, onSubmit }: PermissionDialogProps) => {
  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {data ? 'Edit Permission' : 'Add New Permission'}
        <Typography component='span' className='flex flex-col text-center'>
          {data ? 'Edit permission as per your requirements.' : 'Permissions you may use and assign to your users.'}
        </Typography>
      </DialogTitle>
      {data ? <EditContent handleClose={handleClose} data={data} onSubmit={onSubmit} /> : <AddContent handleClose={handleClose} onSubmit={onSubmit} />}
    </Dialog>
  )
}

export default PermissionDialog
