'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import { db as brandingData } from '@galaxy/fake-db/pages/branding'

import type { BrandingData } from '@/types/pages/brandingTypes'

// Data Imports

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  // Vars
  const branding: BrandingData = brandingData

  return (
    <div
      className={classnames(horizontalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className='text-textSecondary'>{branding.copyright.prefix.replace('{year}', String(new Date().getFullYear()))}</span>
        <span>{branding.copyright.heart}</span>
        <span className='text-textSecondary'>{branding.copyright.separator}</span>
        <Link href={branding.company.url} target='_blank' className='text-primary uppercase'>
          {branding.company.name}
        </Link>
      </p>
      {!isBreakpointReached && (
        <div className='flex items-center gap-4'>
          {branding.footerLinks.map((link, index) => (
            <Link key={index} href={link.url} target='_blank' className='text-primary'>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default FooterContent
