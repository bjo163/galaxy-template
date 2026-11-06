'use client'

import NextLink from 'next/link'

import { OptionMenu } from '@galaxy/ui'
import type { OptionsMenuType } from '@galaxy/ui'

import { useSettings } from '@core/hooks/useSettings'

const AppOptionMenu = (props: Omit<OptionsMenuType, 'linkComponent' | 'paperClassName'>) => {
  const { settings } = useSettings()

  return (
    <OptionMenu
      {...props}
      linkComponent={NextLink}
      paperClassName={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}
    />
  )
}

export default AppOptionMenu
export type { OptionsMenuType, OptionType, OptionMenuItemType, OptionDividerType } from '@galaxy/ui'
