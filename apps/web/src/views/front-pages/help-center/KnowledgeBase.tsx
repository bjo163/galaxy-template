// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import { CustomAvatar } from '@galaxy/ui'

import { db } from '@galaxy/fake-db/pages/frontPages'

import { DirectionalIcon } from '@galaxy/ui'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

// Type Imports
import type { HelpCenterArticleCategory } from '@/types/pages/frontPagesTypes'

// Data Imports

// Data
const allArticles: HelpCenterArticleCategory[] = db.helpCenter.articleCategories

const KnowledgeBase = () => {
  return (
    <section className={classnames('flex flex-col gap-6 md:plb-[100px] plb-[50px]', frontCommonStyles.layoutSpacing)}>
      <Typography variant='h4' className='text-center'>
        Knowledge Base
      </Typography>
      <Grid container spacing={6}>
        {allArticles.map((article, index) => {
          return (
            <Grid size={{ xs: 12, lg: 4 }} key={index}>
              <Card>
                <CardContent className='flex flex-col items-start gap-6 text-center'>
                  <div className='flex gap-3 items-center'>
                    <CustomAvatar skin='light' variant='rounded' color='primary' size={32}>
                      <i className={classnames('text-xl', article.icon)} />
                    </CustomAvatar>
                    <Typography variant='h5'>{article.title}</Typography>
                  </div>
                  <div className='flex flex-col gap-2 is-full'>
                    {article.articles.map((data, index) => {
                      return (
                        <div key={index} className='flex justify-between items-center gap-2'>
                          <Typography
                            color='text.primary'
                            component={Link}
                            href='/front-pages/help-center/article/how-to-add-product-in-cart'
                            className='truncate'
                          >
                            {data.title}
                          </Typography>
                          <DirectionalIcon
                            ltrIconClass='tabler-chevron-right text-textDisabled text-xl'
                            rtlIconClass='tabler-chevron-left text-textDisabled text-xl'
                          />
                        </div>
                      )
                    })}
                  </div>
                  <Link
                    href='/front-pages/help-center/article/how-to-add-product-in-cart'
                    className='flex items-center gap-x-2 text-primary'
                  >
                    <span className='font-medium'>See all 6 articles</span>
                    <DirectionalIcon
                      className='text-lg'
                      ltrIconClass='tabler-arrow-right'
                      rtlIconClass='tabler-arrow-left'
                    />
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </section>
  )
}

export default KnowledgeBase
