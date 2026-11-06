// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { Skin } from '@core/types'

const card = (skin: Skin): Theme['components'] => {
  return {
    MuiCard: {
      defaultProps: {
        ...(skin === 'bordered' && {
          variant: 'outlined'
        })
      },
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.variant !== 'outlined' && {
            boxShadow: '0 1px 2px rgb(var(--mui-mainColorChannels-shadow) / 0.06)',
            border: '1px solid var(--mui-palette-divider)'
          })
        })
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(4),
          '& + .MuiCardContent-root, & + .MuiCardActions-root': {
            paddingBlockStart: 0
          },
          '& + .MuiCollapse-root .MuiCardContent-root:first-child, & + .MuiCollapse-root .MuiCardActions-root:first-child':
            {
              paddingBlockStart: 0
            }
        }),
        subheader: ({ theme }) => ({
          ...theme.typography.subtitle1,
          color: 'rgb(var(--mui-palette-text-primaryChannel) / 0.55)'
        }),
        action: ({ theme }) => ({
          ...theme.typography.body1,
          color: 'var(--mui-palette-text-disabled)',
          marginBlock: 0,
          marginInlineEnd: 0,
          '& .MuiIconButton-root': {
            color: 'inherit'
          }
        })
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(4),
          color: 'var(--mui-palette-text-secondary)',
          '&:last-child': {
            paddingBlockEnd: theme.spacing(4)
          },
          '& + .MuiCardHeader-root, & + .MuiCardContent-root, & + .MuiCardActions-root': {
            paddingBlockStart: 0
          },
          '& + .MuiCollapse-root .MuiCardHeader-root:first-child, & + .MuiCollapse-root .MuiCardContent-root:first-child, & + .MuiCollapse-root .MuiCardActions-root:first-child':
            {
              paddingBlockStart: 0
            }
        })
      }
    },
    MuiCardActions: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(4),
          '& .MuiButtonBase-root:not(:first-of-type)': {
            marginInlineStart: theme.spacing(4)
          },
          '&:where(.card-actions-dense)': {
            padding: theme.spacing(3),
            '& .MuiButton-text': {
              paddingInline: theme.spacing(3)
            }
          },
          '& + .MuiCardHeader-root, & + .MuiCardContent-root, & + .MuiCardActions-root': {
            paddingBlockStart: 0
          },
          '& + .MuiCollapse-root .MuiCardHeader-root:first-child, & + .MuiCollapse-root .MuiCardContent-root:first-child, & + .MuiCollapse-root .MuiCardActions-root:first-child':
            {
              paddingBlockStart: 0
            }
        })
      }
    }
  }
}

export default card
