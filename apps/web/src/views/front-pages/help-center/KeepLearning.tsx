import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// SVG Imports
import { db } from '@galaxy/fake-db/pages/frontPages'

import Laptop from '@assets/svg/front-pages/help-center/Laptop'
import Bulb from '@assets/svg/front-pages/help-center/Bulb'
import Discord from '@assets/svg/front-pages/help-center/Discord'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

// Type Imports
import type { HelpCenterGraphicArticle } from '@/types/pages/frontPagesTypes'

// Data Imports

// Data
const keepLearning: HelpCenterGraphicArticle[] = db.helpCenter.keepLearning

// Maps the fake-db icon keys to their inline SVG components
const articleIcons: Record<HelpCenterGraphicArticle['icon'], ReactNode> = {
  rocket: <Laptop color='var(--mui-palette-text-secondary)' />,
  gift: <Bulb color='var(--mui-palette-text-secondary)' />,
  file: <Discord color='var(--mui-palette-text-secondary)' />,
  laptop: <Laptop color='var(--mui-palette-text-secondary)' />,
  bulb: <Bulb color='var(--mui-palette-text-secondary)' />,
  discord: <Discord color='var(--mui-palette-text-secondary)' />
}

const KeepLearning = () => {
  return (
    <section className='flex flex-col md:plb-[100px] plb-[50px] bg-backgroundPaper'>
      <div className={frontCommonStyles.layoutSpacing}>
        <Typography variant='h4' className='text-center mbe-6'>
          Keep Learning
        </Typography>
        <Grid container spacing={6}>
          {keepLearning.map((article, index) => {
            return (
              <Grid size={{ xs: 12, lg: 4 }} key={index}>
                <Card variant='outlined'>
                  <CardContent className='flex flex-col items-center justify-center gap-3 text-center'>
                    {articleIcons[article.icon]}
                    <Typography variant='h5'>{article.title}</Typography>
                    <Typography>{article.subtitle}</Typography>
                    <Button
                      component={Link}
                      href='/front-pages/help-center/article/how-to-add-product-in-cart'
                      variant='tonal'
                      size='small'
                    >
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </div>
    </section>
  )
}

export default KeepLearning
