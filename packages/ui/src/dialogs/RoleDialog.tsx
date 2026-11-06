'use client'

import { useState, useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'

import DialogCloseButton from './DialogCloseButton'
import CustomTextField from '../mui/CustomTextField'
import tableStyles from '../styles/table.module.css'

export type RoleDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  title?: string
  permissions?: RolePermissionRow[]
  selected?: string[]
  onSubmit?: (roleName: string, selected: string[]) => void
}

export type RolePermissionRow =
  | string
  | {
      title: string
      read?: boolean
      write?: boolean
      select?: boolean
    }

const defaultData: RolePermissionRow[] = [
  'User Management',
  'Content Management',
  'Disputes Management',
  'Database Management',
  'Financial Management',
  'Reporting',
  'API Control',
  'Repository Management',
  'Payroll'
]

const RoleDialog = ({ open, setOpen, title, permissions = defaultData, selected, onSubmit }: RoleDialogProps) => {
  const [roleName, setRoleName] = useState(title ?? '')

  const [selectedCheckbox, setSelectedCheckbox] = useState<string[]>(
    selected ??
      (title
        ? [
            'user-management-read',
            'user-management-write',
            'user-management-create',
            'disputes-management-read',
            'disputes-management-write',
            'disputes-management-create'
          ]
        : [])
  )

  const [isIndeterminateCheckbox, setIsIndeterminateCheckbox] = useState<boolean>(false)

  useEffect(() => {
    if (open) {
      setRoleName(title ?? '')
      if (selected) setSelectedCheckbox(selected)
    }
  }, [open, title, selected])

  const handleClose = () => {
    setOpen(false)
  }

  const togglePermission = (id: string) => {
    const arr = [...selectedCheckbox]

    if (arr.includes(id)) {
      arr.splice(arr.indexOf(id), 1)
      setSelectedCheckbox(arr)
    } else {
      arr.push(id)
      setSelectedCheckbox(arr)
    }
  }

  const handleSelectAllCheckbox = () => {
    if (isIndeterminateCheckbox) {
      setSelectedCheckbox([])
    } else {
      const all: string[] = []

      permissions.forEach(row => {
        const id = (typeof row === 'string' ? row : row.title).toLowerCase().split(' ').join('-')

        all.push(`${id}-read`, `${id}-write`, `${id}-create`)
      })
      setSelectedCheckbox(all)
    }
  }

  useEffect(() => {
    if (selectedCheckbox.length > 0 && selectedCheckbox.length < permissions.length * 3) {
      setIsIndeterminateCheckbox(true)
    } else {
      setIsIndeterminateCheckbox(false)
    }
  }, [selectedCheckbox, permissions.length])

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      scroll='body'
      open={open}
      onClose={handleClose}
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {title ? 'Edit Role' : 'Add Role'}
        <Typography component='span' className='flex flex-col text-center'>
          Set Role Permissions
        </Typography>
      </DialogTitle>
      <form
        onSubmit={e => {
          e.preventDefault()
          onSubmit?.(roleName, selectedCheckbox)
          handleClose()
        }}
      >
        <DialogContent className='overflow-visible flex flex-col gap-6 pbs-0 sm:pli-16'>
          <CustomTextField
            label='Role Name'
            variant='outlined'
            fullWidth
            placeholder='Enter Role Name'
            value={roleName}
            onChange={e => setRoleName(e.target.value)}
          />
          <Typography variant='h5' className='min-is-[225px]'>
            Role Permissions
          </Typography>
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <tbody>
                <tr className='border-bs-0'>
                  <th className='pis-0'>
                    <Typography color='text.primary' className='font-medium whitespace-nowrap grow min-is-[225px]'>
                      Administrator Access
                    </Typography>
                  </th>
                  <th className='text-end! pie-0'>
                    <FormControlLabel
                      className='mie-0 capitalize'
                      control={
                        <Checkbox
                          onChange={handleSelectAllCheckbox}
                          indeterminate={isIndeterminateCheckbox}
                          checked={selectedCheckbox.length === permissions.length * 3}
                        />
                      }
                      label='Select All'
                    />
                  </th>
                </tr>
                {permissions.map((item, index) => {
                  const id = (typeof item === 'string' ? item : item.title).toLowerCase().split(' ').join('-')

                  return (
                    <tr key={index} className='border-be'>
                      <td className='pis-0'>
                        <Typography className='font-medium whitespace-nowrap grow min-is-[225px]' color='text.primary'>
                          {typeof item === 'object' ? item.title : item}
                        </Typography>
                      </td>
                      <td className='text-end! pie-0'>
                        {typeof item === 'object' ? (
                          <FormGroup className='flex-row justify-end flex-nowrap gap-6'>
                            <FormControlLabel className='mie-0' control={<Checkbox checked={item.read} />} label='Read' />
                            <FormControlLabel className='mie-0' control={<Checkbox checked={item.write} />} label='Write' />
                            <FormControlLabel className='mie-0' control={<Checkbox checked={item.select} />} label='Select' />
                          </FormGroup>
                        ) : (
                          <FormGroup className='flex-row justify-end flex-nowrap gap-6'>
                            <FormControlLabel
                              className='mie-0'
                              control={
                                <Checkbox
                                  id={`${id}-read`}
                                  onChange={() => togglePermission(`${id}-read`)}
                                  checked={selectedCheckbox.includes(`${id}-read`)}
                                />
                              }
                              label='Read'
                            />
                            <FormControlLabel
                              className='mie-0'
                              control={
                                <Checkbox
                                  id={`${id}-write`}
                                  onChange={() => togglePermission(`${id}-write`)}
                                  checked={selectedCheckbox.includes(`${id}-write`)}
                                />
                              }
                              label='Write'
                            />
                            <FormControlLabel
                              className='mie-0'
                              control={
                                <Checkbox
                                  id={`${id}-create`}
                                  onChange={() => togglePermission(`${id}-create`)}
                                  checked={selectedCheckbox.includes(`${id}-create`)}
                                />
                              }
                              label='Create'
                            />
                          </FormGroup>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' type='submit'>
            Submit
          </Button>
          <Button variant='tonal' type='reset' color='secondary' onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default RoleDialog
