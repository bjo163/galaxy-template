'use client'

// React Imports
import { forwardRef } from 'react'

// MUI Imports
import MuiAvatar from '@mui/material/Avatar'
import { lighten, styled } from '@mui/material/styles'

// Type Imports
import type { CustomAvatarProps } from '@galaxy/types/base'

import type { ThemeColor } from '@core/types'

export type { CustomAvatarProps }

const Avatar = styled(MuiAvatar)<CustomAvatarProps>(({ skin, color, size, theme }) => {
  return {
    ...(color &&
      skin === 'light' && {
        backgroundColor: `var(--mui-palette-${color}-lightOpacity)`,
        color: `var(--mui-palette-${color}-main)`
      }),
    ...(color &&
      skin === 'light-static' && {
        backgroundColor: lighten(theme.palette[color as ThemeColor].main, 0.84),
        color: `var(--mui-palette-${color}-main)`
      }),
    ...(color &&
      skin === 'filled' && {
        backgroundColor: `var(--mui-palette-${color}-main)`,
        color: `var(--mui-palette-${color}-contrastText)`
      }),
    ...(size && {
      height: size,
      width: size
    })
  }
})

const CustomAvatar = forwardRef<HTMLDivElement, CustomAvatarProps>((props: CustomAvatarProps, ref) => {
  // Props
  const { color, skin = 'filled', ...rest } = props

  return <Avatar color={color} skin={skin} ref={ref} {...rest} />
})

export default CustomAvatar
