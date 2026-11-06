import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

import type { CardStatsSquareProps } from '@galaxy/types/pages/widgetTypes'

import CustomAvatar from '../CustomAvatar'

const CardStatsSquare = (props: CardStatsSquareProps) => {
  const { avatarColor, avatarIcon, stats, statsTitle, avatarVariant, avatarSize, avatarSkin } = props

  return (
    <Card>
      <CardContent className='flex flex-col items-center gap-2'>
        <CustomAvatar color={avatarColor} skin={avatarSkin} variant={avatarVariant} size={avatarSize}>
          <i className={avatarIcon} />
        </CustomAvatar>
        <div className='flex flex-col items-center gap-1'>
          <Typography variant='h5'>{stats}</Typography>
          <Typography color='text.secondary'>{statsTitle}</Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default CardStatsSquare
