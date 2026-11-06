'use client'

import { CustomIconButton } from '@galaxy/ui'
import type { CustomIconButtonProps } from '@galaxy/ui'

import themeConfig from '@configs/themeConfig'

const IconButton = (props: CustomIconButtonProps) => (
  <CustomIconButton disableRipple={themeConfig.disableRipple} {...props} />
)

export default IconButton
export type { CustomIconButtonProps }
