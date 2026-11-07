// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Type Imports
import { CustomAvatar } from '@galaxy/ui'

import type { ThemeColor } from '@core/types'

// Components Imports
import { OptionMenu } from '@galaxy/ui'

import type { AcademyTopCourse } from '@galaxy/types/apps/academyTypes'

type DataType = AcademyTopCourse

const TopCourses = ({ data }: { data: DataType[] }) => {
  return (
    <Card>
      <CardHeader title='Top Courses' action={<OptionMenu options={['Last 28 Days', 'Last Month', 'Last Year']} />} />
      <CardContent className='flex flex-col gap-6'>
        {data.map((item, i) => (
          <div key={i} className='flex items-center gap-4'>
            <CustomAvatar variant='rounded' skin='light' color={item.color}>
              <i className={item.icon} />
            </CustomAvatar>
            <div className='flex justify-between items-center gap-4 is-full flex-wrap'>
              <Typography className='font-medium flex-1' color='text.primary'>
                {item.title}
              </Typography>
              <Chip label={`${item.views} Views`} variant='tonal' size='small' color='secondary' />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default TopCourses
