// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

// SVG Imports
import { db } from '@galaxy/fake-db/pages/frontPages'

import Check from '@assets/svg/front-pages/landing-page/Check'
import User from '@assets/svg/front-pages/landing-page/User'
import LaptopCharging from '@assets/svg/front-pages/landing-page/LaptopCharging'
import Diamond from '@assets/svg/front-pages/landing-page/Diamond'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

// Type Imports
import type { LandingProductStat } from '@/types/pages/frontPagesTypes'

// Data Imports

// Data
const statData: LandingProductStat[] = db.landing.productStats

// Maps the fake-db icon keys to their inline SVG components
const statIcons: Record<LandingProductStat['icon'], ReactNode> = {
  'laptop-charging': <LaptopCharging color='var(--mui-palette-primary-main)' />,
  user: <User color='var(--mui-palette-success-main)' />,
  diamond: <Diamond color='var(--mui-palette-info-main)' />,
  check: <Check color='var(--mui-palette-warning-main)' />
}

const ProductStat = () => {
  return (
    <section className='plb-[84px] bg-backgroundPaper'>
      <div className={frontCommonStyles.layoutSpacing}>
        <Grid container spacing={6}>
          {statData.map((stat, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <div
                className='flex flex-col items-center justify-center gap-y-4 border p-6 rounded'
                style={{
                  borderColor: stat.color
                }}
              >
                {statIcons[stat.icon]}
                <div className='text-center'>
                  <Typography variant='h3' className='font-medium'>
                    {stat.value}
                  </Typography>
                  <Typography className='font-medium'>{stat.title}</Typography>
                </div>
              </div>
            </Grid>
          ))}
        </Grid>
      </div>
    </section>
  )
}

export default ProductStat
