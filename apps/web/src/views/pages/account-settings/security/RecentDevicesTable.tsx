// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'

// Type Imports
import type { RecentDeviceItem } from '@/types/apps/userViewTypes'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const browserIconMap: Record<RecentDeviceItem['browserIcon'], ReactNode> = {
  windows: <i className='tabler-brand-windows text-[22px] text-info' />,
  android: <i className='tabler-brand-android text-[22px] text-success' />,
  apple: <i className='tabler-brand-apple text-[22px] text-secondary' />,
  mobile: <i className='tabler-device-mobile text-[22px] text-error' />
}

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
                    {browserIconMap[device.browserIcon]}
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
