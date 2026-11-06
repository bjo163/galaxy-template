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

// Third-party Imports
import classnames from 'classnames'

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
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Connected Accounts'
            subheader='Display content from your connected accounts on your site'
          />
          <CardContent className='flex flex-col gap-4'>
            {connectedAccounts.map((item, index) => (
              <div key={index} className='flex items-center justify-between gap-4'>
                <div className='flex grow items-center gap-4'>
                  <img height={36} width={36} src={item.logo} alt={item.title} />
                  <div className='flex flex-col grow gap-0.5'>
                    <Typography className='font-medium' color='text.primary'>
                      {item.title}
                    </Typography>
                    <Typography>{item.subtitle}</Typography>
                  </div>
                </div>
                <Switch defaultChecked={item.checked} />
              </div>
            ))}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Social Accounts' subheader='Display content from social accounts on your site' />
          <CardContent className='flex flex-col gap-4'>
            {socialAccounts.map((item, index) => (
              <div key={index} className='flex items-center justify-between gap-4'>
                <div className='flex grow items-center gap-4'>
                  <img height={36} width={36} src={item.logo} alt={item.title} />
                  <div className='flex flex-col grow gap-0.5'>
                    <Typography className='font-medium' color='text.primary'>
                      {item.title}
                    </Typography>
                    {item.isConnected ? (
                      <Typography color='primary.main' component={Link} href={item.href || '/'} target='_blank'>
                        {item.username}
                      </Typography>
                    ) : (
                      <Typography>Not Connected</Typography>
                    )}
                  </div>
                </div>
                <CustomIconButton variant='tonal' color={item.isConnected ? 'error' : 'secondary'}>
                  <i className={classnames(item.isConnected ? 'tabler-trash text-error' : 'tabler-link')} />
                </CustomIconButton>
              </div>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ConnectionsView
