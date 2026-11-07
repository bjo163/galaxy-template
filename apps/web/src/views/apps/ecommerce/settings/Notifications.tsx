// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'

import { db as ecommerceData } from '@galaxy/fake-db/apps/ecommerce'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

type tableData = { type: string; email: boolean; app: boolean }

type CardProps = {
  title: string
  data: tableData[]
}

const TableCard = (props: CardProps) => {
  // Props
  const { title, data } = props

  return (
    <div className='flex flex-col gap-4'>
      <Typography variant='h5'>{title}</Typography>
      <div className='border rounded overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead className='border-0'>
            <tr>
              <th className='is-2/4'>Type</th>
              <th className='is-1/4'>Email</th>
              <th className='is-1/4'>App</th>
            </tr>
          </thead>
          <tbody>
            {data.map((data, index) => (
              <tr key={index}>
                <td className='text-textPrimary'>{data.type}</td>
                <td>
                  <Checkbox defaultChecked={data.email} />
                </td>
                <td>
                  <Checkbox defaultChecked={data.app} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Notifications = () => {
  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <TableCard title='Customer' data={ecommerceData.notificationSettings.customer} />
        <TableCard title='Orders' data={ecommerceData.notificationSettings.orders} />
        <TableCard title='Shipping' data={ecommerceData.notificationSettings.shipping} />
      </CardContent>
    </Card>
  )
}

export default Notifications
