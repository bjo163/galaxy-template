'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

// Components Imports
import OptionMenu from '@core/components/option-menu'

// Type Imports
import type { WidgetBrowserState } from '@/types/pages/widgetExamplesAdvancedTypes'

const BrowserStates = ({ data }: { data: WidgetBrowserState[] }) => {
  return (
    <Card>
      <CardHeader
        title='Browser States'
        subheader='Counter April 2022'
        action={<OptionMenu options={['Last 28 Days', 'Last Month', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-8'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <img src={item.imgSrc} alt={item.title} width={28} />
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <Typography className='font-medium' color='text.primary'>
                {item.title}
              </Typography>
              <div className='flex items-center gap-4'>
                <Typography>{item.percentage}</Typography>
                <div className='flex relative'>
                  <CircularProgress
                    variant='determinate'
                    size={26}
                    value={100}
                    thickness={5}
                    sx={{ position: 'absolute', color: 'var(--mui-palette-customColors-trackBg)' }}
                  />
                  <CircularProgress
                    variant='determinate'
                    size={26}
                    value={item.progress}
                    thickness={5}
                    color={item.progressColor}
                    sx={{ '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default BrowserStates
