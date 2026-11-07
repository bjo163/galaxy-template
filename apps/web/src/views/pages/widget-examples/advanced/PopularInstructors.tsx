// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

// Components Imports
import { CustomAvatar } from '@galaxy/ui'

import { OptionMenu } from '@galaxy/ui'

import type { WidgetPopularInstructor } from '@/types/pages/widgetExamplesAdvancedTypes'

const PopularInstructors = ({ data }: { data: WidgetPopularInstructor[] }) => {
  return (
    <Card className='bs-full'>
      <CardHeader title='Popular Instructors' action={<OptionMenu options={['Refresh', 'Update', 'Share']} />} />
      <Divider />
      <div className='flex justify-between plb-4 pli-6'>
        <Typography className='uppercase'>instructors</Typography>
        <Typography className='uppercase'>courses</Typography>
      </div>
      <Divider />
      <CardContent className='flex flex-col gap-4'>
        {data.map((item, i) => (
          <div key={i} className='flex items-center gap-4'>
            <CustomAvatar size={34} src={item.avatar} />
            <div className='flex justify-between items-center is-full gap-4'>
              <div>
                <Typography className='font-medium' color='text.primary'>
                  {item.name}
                </Typography>
                <Typography variant='body2'>{item.profession}</Typography>
              </div>
              <Typography className='font-medium' color='text.primary'>
                {item.totalCourses}
              </Typography>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default PopularInstructors
