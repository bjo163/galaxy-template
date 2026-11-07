// React Imports
// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'

// Type Imports
import type { RecentDeviceItem } from '@/types/apps/userViewTypes'

import { ICON_MAP } from '@/app/client/iconMap'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const RecentDevicesTable = ({ data }: { data: RecentDeviceItem[] }) => {
  return (
    <Card>
      <CardHeader title='Recent Devices' />
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Browser</th>
              <th>Device</th>
              <th>Location</th>
              <th>Recent Activities</th>
            </tr>
          </thead>
          <tbody>
            {data.map((device, index) => (
              <tr key={index}>
                <td>
                  <div className='flex items-center gap-2.5'>
                    {ICON_MAP[device.browserIcon]}
                    <Typography className='font-medium' color='text.primary'>
                      {device.browser}
                    </Typography>
                  </div>
                </td>
                <td>
                  <Typography>{device.device}</Typography>
                </td>
                <td>
                  <Typography>{device.location}</Typography>
                </td>
                <td>
                  <Typography>{device.recentActivity}</Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default RecentDevicesTable
