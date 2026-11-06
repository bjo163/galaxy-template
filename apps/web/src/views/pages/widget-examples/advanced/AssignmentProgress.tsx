// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import { CustomIconButton } from '@galaxy/ui'


// Components Imports
import OptionMenu from '@core/components/option-menu'
import DirectionalIcon from '@components/DirectionalIcon'

import type { WidgetAssignmentProgress } from '@/types/pages/widgetExamplesAdvancedTypes'

const AssignmentProgress = ({ data }: { data: WidgetAssignmentProgress[] }) => {
  return (
    <Card>
      <CardHeader title='Assignment Progress' action={<OptionMenu options={['Refresh', 'Update', 'Share']} />} />
      <CardContent className='flex flex-col gap-8'>
        {data.map((item, i) => (
          <div key={i} className='flex items-center gap-4'>
            <div className='relative flex items-center justify-center'>
              <CircularProgress
                variant='determinate'
                size={54}
                value={100}
                thickness={3}
                className='absolute text-[var(--mui-palette-customColors-trackBg)]'
              />
              <CircularProgress
                variant='determinate'
                size={54}
                value={item.progress}
                thickness={3}
                color={item.color}
                sx={{ '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
              />
              <Typography className='absolute font-medium' color='text.primary'>
                {`${item.progress}%`}
              </Typography>
            </div>
            <div className='flex justify-between items-center is-full gap-4'>
              <div>
                <Typography className='font-medium mbe-1.5' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{`${item.tasks} Tasks`}</Typography>
              </div>
              <CustomIconButton size='small' variant='tonal' color='secondary' className='min-is-fit'>
                <DirectionalIcon ltrIconClass='tabler-chevron-right' rtlIconClass='tabler-chevron-left' />
              </CustomIconButton>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default AssignmentProgress
