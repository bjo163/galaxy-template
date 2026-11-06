'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'

// Component Imports
import { CustomIconButton } from '@galaxy/ui'

// Type Imports
import type { ConnectedAccount, SocialAccount } from '@/types/apps/userViewTypes'

type Props = {
  connectedAccounts: ConnectedAccount[]
  socialAccounts: SocialAccount[]
}

const ConnectionsView = ({ connectedAccounts, socialAccounts }: Props) => {
  return (
    <Card>
      <Grid container>
        <Grid size={{ xs: 12, md: 6 }}>
          <CardHeader
            title='Connected Accounts'
            subheader='Display content from your connected accounts on your site'
          />
          <CardContent className='flex flex-col gap-4'>
            {connectedAccounts.map((item, index) => (
              <div key={index} className='flex items-center justify-between gap-4'>
                <div className='flex grow items-center gap-4'>
                  <img height={32} width={32} src={item.logo} alt={item.title} />
                  <div className='grow'>
                    <Typography className='text-textPrimary font-medium'>{item.title}</Typography>
                    <Typography variant='body2'>{item.subtitle}</Typography>
                  </div>
                </div>
                <Switch defaultChecked={item.checked} />
              </div>
            ))}
          </CardContent>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CardHeader title='Social Accounts' subheader='Display content from social accounts on your site' />
          <CardContent className='flex flex-col gap-4'>
            {socialAccounts.map((item, index) => (
              <div key={index} className='flex items-center justify-between gap-4'>
                <div className='flex grow items-center gap-4'>
                  <img height={32} width={32} src={item.logo} alt={item.title} />
                  <div className='grow'>
                    <Typography className='text-textPrimary font-medium'>{item.title}</Typography>
                    {item.isConnected ? (
                      <Typography
                        variant='body2'
                        color='primary.main'
                        component={Link}
                        href={item.href || '/'}
                        target='_blank'
                      >
                        {item.username}
                      </Typography>
                    ) : (
                      <Typography variant='body2'>Not Connected</Typography>
                    )}
                  </div>
                </div>
                <CustomIconButton variant='tonal' color={item.isConnected ? 'error' : 'secondary'}>
                  <i className={item.isConnected ? 'tabler-trash' : 'tabler-link'} />
                </CustomIconButton>
              </div>
            ))}
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  )
}

export default ConnectionsView
