// MUI Imports
import type { AvatarProps } from '@mui/material/Avatar'

// MUI Chip `tonal` variant augmentation (mirrors apps/web theme types; required by @galaxy/types
// consumers such as @galaxy/fake-db so ChipProps['variant'] accepts 'tonal' outside the app program).
declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    tonal: true
  }
}

export type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

export type CustomAvatarProps = AvatarProps & {
  color?: ThemeColor
  skin?: 'filled' | 'light' | 'light-static'
  size?: number
}
