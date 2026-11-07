// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'

// Style Imports
import { db as accountSettingsData } from '@galaxy/fake-db/pages/accountSettings'

import tableStyles from '@core/styles/table.module.css'


const NotificationsTab = () => {
  return (
    <Card>
      <CardHeader title='Notifications' subheader='You will receive notification for the below selected items' />
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Type</th>
              <th>App</th>
              <th>Email</th>
              <th>Browser</th>
            </tr>
          </thead>
          <tbody className='border-be'>
            {accountSettingsData.userNotifications.map((data, index) => (
              <tr key={index}>
                <td>
                  <Typography color='text.primary'>{data.type}</Typography>
                </td>
                <td>
                  <Checkbox defaultChecked={data.app} />
                </td>
                <td>
                  <Checkbox defaultChecked={data.email} />
                </td>
                <td>
                  <Checkbox defaultChecked={data.browser} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CardActions className='flex items-center'>
        <Button variant='contained' type='submit'>
          Save Changes
        </Button>
        <Button variant='tonal' color='secondary' type='reset'>
          Discard
        </Button>
      </CardActions>
    </Card>
  )
}

export default NotificationsTab
