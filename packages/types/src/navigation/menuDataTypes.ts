// Navigation menu data shapes. These are plain-data twins of the web
// `@/types/menuTypes` structures (which depend on @menu component props).
// `suffix.icon` (string) replaces the JSX `<i className='...' />` suffixes
// so that the whole menu tree can live in @galaxy/fake-db as pure data.

export type MenuChipSuffix = {
  label: string
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
}

export type MenuIconSuffix = {
  icon: string
}

export type MenuNodeBase = {
  label: string
  href?: string
  icon?: string
  target?: '_blank'
  excludeLang?: boolean
  exactMatch?: boolean
  activeUrl?: string
  disabled?: boolean
  prefix?: MenuChipSuffix
  suffix?: MenuChipSuffix | MenuIconSuffix
}

export type MenuNodeData =
  | MenuNodeBase
  | (MenuNodeBase & { children: MenuNodeData[]; isSection?: undefined })
  | (MenuNodeBase & { isSection: true; children: MenuNodeData[] })

// The subset of the i18n dictionary the menus need, as plain strings.
export type MenuLabels = Record<string, string>
