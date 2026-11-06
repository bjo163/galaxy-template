'use client'

import type { ReactNode } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'

import classnames from 'classnames'

import CustomTextField from '../mui/CustomTextField'
import CustomAvatar from '../CustomAvatar'
import DialogCloseButton from './DialogCloseButton'

export type ReferEarnStep = {
  icon?: ReactNode
  title: string
  subtitle: string
}

export type ReferEarnDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  subtitle?: ReactNode
  steps: ReferEarnStep[]
  inviteLabel?: string
  inviteEmailLabel?: string
  invitePlaceholder?: string
  inviteButtonLabel?: string
  shareLabel?: string
  shareLinkLabel?: string
  sharePlaceholder?: string
  onInvite?: (email: string) => void
  onCopyLink?: (link: string) => void
  socialActions?: ReactNode
}

const ReferEarnDialog = ({
  open,
  setOpen,
  subtitle,
  steps,
  inviteLabel = 'Invite your friends',
  inviteEmailLabel,
  invitePlaceholder = 'johnDoe@email.com',
  inviteButtonLabel = 'Send',
  shareLabel = 'Share the referral link',
  shareLinkLabel,
  sharePlaceholder = 'http://pixinvent.link',
  onInvite,
  onCopyLink,
  socialActions
}: ReferEarnDialogProps) => {
  return (
    <Dialog
      fullWidth
      open={open}
      onClose={() => setOpen(false)}
      maxWidth='md'
      scroll='body'
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-12 sm:pli-16'>
        Refer & Earn
        {subtitle ? (
          <Typography component='span' className='flex flex-col text-center'>
            {subtitle}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent className='flex flex-col gap-6 pbs-0 sm:pli-16 sm:pbe-16'>
        <Grid container spacing={6}>
          {steps?.map((option, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <div className='flex items-center flex-col gap-4'>
                <CustomAvatar
                  variant='rounded'
                  skin='light'
                  color='primary'
                  className='bs-[66px] is-[66px] sm:bs-[88px] sm:is-[88px]'
                >
                  {typeof option.icon === 'string' ? (
                    <i className={classnames('text-[32px] sm:text-[40px]', option.icon)} />
                  ) : (
                    option.icon
                  )}
                </CustomAvatar>
                <div className='flex flex-col gap-2 text-center'>
                  <Typography variant='h5'>{option.title}</Typography>
                  <Typography>{option.subtitle}</Typography>
                </div>
              </div>
            </Grid>
          ))}
        </Grid>
        <Divider className='mbs-6' />
        <div className='flex flex-col gap-6'>
          <Typography variant='h5'>{inviteLabel}</Typography>
          <form
            className='flex items-end is-full flex-wrap sm:flex-nowrap gap-4'
            onSubmit={e => {
              e.preventDefault()
              const input = e.currentTarget.querySelector('input[name="refer-email"]') as HTMLInputElement | null

              if (input?.value) onInvite?.(input.value)
            }}
          >
            <CustomTextField
              fullWidth
              size='small'
              name='refer-email'
              id='refer-email'
              placeholder={invitePlaceholder}
              label={inviteEmailLabel}
            />
            <Button type='submit' variant='contained' className='max-sm:is-full'>
              {inviteButtonLabel}
            </Button>
          </form>
        </div>
        <div className='flex flex-col gap-6'>
          <Typography variant='h5'>{shareLabel}</Typography>
          <div className='flex items-end justify-center sm:justify-initial flex-wrap sm:flex-nowrap gap-4'>
            <CustomTextField
              fullWidth
              size='small'
              id='refer-social'
              name='refer-link'
              placeholder={sharePlaceholder}
              label={shareLinkLabel}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Button
                        size='small'
                        type='button'
                        className='capitalize !text-primary'
                        onClick={() => {
                          const input = document.getElementById('refer-social') as HTMLInputElement | null

                          onCopyLink?.(input?.value || sharePlaceholder)
                        }}
                      >
                        Copy Link
                      </Button>
                    </InputAdornment>
                  )
                }
              }}
            />
            {socialActions ? <div className='flex items-center gap-1'>{socialActions}</div> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReferEarnDialog
