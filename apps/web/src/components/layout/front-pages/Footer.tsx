'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import { db as brandingData } from '@galaxy/fake-db/pages/branding'

import { CustomTextField } from '@galaxy/ui'

import type { Mode } from '@core/types'
import type { BrandingData } from '@/types/pages/brandingTypes'

// Data Imports

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'



// Hooks Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Util Imports
import { frontLayoutClasses } from '@layouts/utils/layoutClasses'

// Styles Imports
import styles from './styles.module.css'
import frontCommonStyles from '@views/front-pages/styles.module.css'

const Footer = ({ mode }: { mode: Mode }) => {
  // Vars
  const footerImageLight = '/images/front-pages/footer-bg-light.png'
  const footerImageDark = '/images/front-pages/footer-bg-dark.png'
  const branding: BrandingData = brandingData

  // Hooks
  const dashboardImage = useImageVariant(mode, footerImageLight, footerImageDark)

  return (
    <footer className={frontLayoutClasses.footer}>
      <div className='relative'>
        <img src={dashboardImage} alt='footer bg' className='absolute inset-0 is-full bs-full object-cover -z-[1]' />
        <div className={classnames('plb-12 text-white', frontCommonStyles.layoutSpacing)}>
          <Grid container rowSpacing={10} columnSpacing={12}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <div className='flex flex-col items-start gap-6'>
                <Link href='/front-pages/landing-page'>
                  <Logo color='var(--mui-palette-common-white)' />
                </Link>
                <Typography color='white' className='md:max-is-[390px] opacity-[0.78]'>
                  {branding.marketing.description}
                </Typography>
                <div className='flex items-end'>
                  <CustomTextField
                    size='small'
                    className={styles.inputBorder}
                    label={branding.marketing.newsletter.label}
                    placeholder={branding.marketing.newsletter.placeholder}
                    sx={{
                      '& .MuiInputBase-root': {
                        borderStartEndRadius: '0 !important',
                        borderEndEndRadius: '0 !important',
                        '&:not(.Mui-focused)': {
                          borderColor: 'rgb(var(--mui-mainColorChannels-dark) / 0.22)'
                        },
                        '&.MuiFilledInput-root:not(.Mui-focused):not(.Mui-disabled):hover': {
                          borderColor: 'rgba(255 255 255 / 0.6) !important'
                        }
                      }
                    }}
                  />
                  <Button
                    variant='contained'
                    color='primary'
                    sx={{
                      borderStartStartRadius: 0,
                      borderEndStartRadius: 0
                    }}
                  >
                    {branding.marketing.newsletter.button}
                  </Button>
                </div>
              </div>
            </Grid>
            {[branding.marketing.pagesColumn, branding.marketing.productsColumn].map(column => (
              <Grid key={column.title} size={{ xs: 12, sm: 3, lg: 2 }}>
                <Typography color='white' className='font-medium mbe-6 opacity-[0.92]'>
                  {column.title}
                </Typography>
                <div className='flex flex-col gap-4'>
                  {column.links.map(link =>
                    link.isNew ? (
                      <Link key={link.label} href={link.url} className='flex items-center gap-[10px]'>
                        <Typography color='white' className='opacity-[0.78]'>
                          {link.label}
                        </Typography>
                        <Chip label='New' color='primary' size='small' />
                      </Link>
                    ) : (
                      <Typography
                        key={link.label}
                        component={Link}
                        href={link.url}
                        color='white'
                        className='opacity-[0.78]'
                      >
                        {link.label}
                      </Typography>
                    )
                  )}
                </div>
              </Grid>
            ))}
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Typography color='white' className='font-medium mbe-6 opacity-[0.92]'>
                Download our App
              </Typography>
              <div className='flex flex-col gap-4'>
                {branding.marketing.appStoreLinks.map(store => (
                  <Link key={store.title} className='bg-[#282C3E] bs-[56px] is-[211px] rounded'>
                    <div className='flex items-center pli-5 plb-[7px] gap-6'>
                      <img src={store.iconImg} alt={store.iconAlt} className='bs-[34px]' />
                      <div className='flex flex-col items-start'>
                        <Typography variant='body2' color='white' className='opacity-75'>
                          {store.overline}
                        </Typography>
                        <Typography color='white' className='font-medium opacity-[0.92]'>
                          {store.title}
                        </Typography>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
      <div className='bg-[#211B2C]'>
        <div
          className={classnames(
            'flex flex-wrap items-center justify-center sm:justify-between gap-4 plb-[15px]',
            frontCommonStyles.layoutSpacing
          )}
        >
          <Typography className='text-white' variant='body2'>
            <span>{branding.copyright.prefix.replace('{year}', String(new Date().getFullYear()))}</span>
            <span>{branding.copyright.heart}</span>
            <span>{branding.copyright.separator}</span>
            <Link href={branding.company.url} target='_blank' className='font-medium text-white'>
              {branding.company.name}
            </Link>
          </Typography>
          <div className='flex gap-1.5 items-center'>
            {branding.socialLinks.map(social => (
              <IconButton key={social.icon} component={Link} size='small' href={social.url} target='_blank'>
                <i className={classnames(social.icon, 'text-white text-lg')} />
              </IconButton>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
