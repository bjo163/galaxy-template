// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

// Type Imports
import type { ApiKeyItem } from '@/types/pages/accountSettingsTypes'

const ApiKeyList = ({ data }: { data: ApiKeyItem[] }) => {
  return (
    <Card>
      <CardHeader title='API Key List & Access' className='pbe-4' />
      <CardContent className='flex flex-col gap-6'>
        <Typography>
          An API key is a simple encrypted string that identifies an application without any principal. They are useful
          for accessing public data anonymously, and are used to associate API requests with your project for quota and
          billing.
        </Typography>
        {data.map((item, index) => (
          <div key={index} className='flex flex-col gap-2 p-4 rounded bg-actionHover'>
            <div className='flex items-center gap-3'>
              <Typography variant='h5'>{item.title}</Typography>
              <Chip color='primary' variant='tonal' label={item.access} size='small' />
            </div>
            <div className='flex items-center gap-1'>
              <Typography className='font-medium'>{item.key}</Typography>
              <div className='flex'>
                <IconButton size='small'>
                  <i className='tabler-copy text-textSecondary' />
                </IconButton>
              </div>
            </div>
            <Typography color='text.disabled'>{`Created on ${item.date}`}</Typography>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default ApiKeyList
