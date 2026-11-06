'use client'

import type { ReactNode } from 'react'

import { CustomIconButton, ReferEarnDialog } from '@galaxy/ui'

import Keyboard from '@/assets/svg/Keyboard'
import Paper from '@/assets/svg/Paper'
import Rocket from '@/assets/svg/Rocket'
import themeConfig from '@configs/themeConfig'

type ReferEarnProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

const ReferEarn = ({ open, setOpen }: ReferEarnProps) => {
  const steps = [
    { icon: <Paper />, title: 'Send Invitation 👍🏻', subtitle: 'Send your referral link to your friend' },
    { icon: <Keyboard />, title: 'Registration 😎', subtitle: 'Let them register to our services' },
    { icon: <Rocket />, title: 'Free Trial  🎉', subtitle: 'Your friend will get 30 days free trial' }
  ] as { icon?: ReactNode; title: string; subtitle: string }[]

  return (
    <ReferEarnDialog
      open={open}
      setOpen={setOpen}
      steps={steps}
      subtitle={`Invite your friend to ${themeConfig.templateName}, if they sign up, you and your friend will get 30 days free trial`}
      inviteEmailLabel={` Enter your friend's email address and invite them to join ${themeConfig.templateName} 😍`}
      shareLinkLabel='You can also copy and send it or share it on your social media. 🚀'
      socialActions={
        <>
          <CustomIconButton className='rounded text-white bg-facebook'>
            <i className='tabler-brand-facebook' />
          </CustomIconButton>
          <CustomIconButton className='rounded text-white bg-twitter'>
            <i className='tabler-brand-twitter' />
          </CustomIconButton>
          <CustomIconButton className='rounded text-white bg-linkedin'>
            <i className='tabler-brand-linkedin' />
          </CustomIconButton>
        </>
      }
    />
  )
}

export default ReferEarn
