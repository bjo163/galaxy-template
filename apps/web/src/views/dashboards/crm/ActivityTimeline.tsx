'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import MuiTimeline from '@mui/lab/Timeline'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import Typography from '@mui/material/Typography'
import type { TimelineProps } from '@mui/lab/Timeline'
import type { ActivityTimelineItem } from '@galaxy/fake-db/apps/activityTimeline'

// Components Imports
import { OptionMenu } from '@galaxy/ui'

import { ICON_MAP } from '@/app/client/iconMap'

// Styled Timeline component
const Timeline = styled(MuiTimeline)<TimelineProps>({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none'
    }
  }
})

interface ActivityTimelineProps {
  data?: ActivityTimelineItem[]
}

const ActivityTimeline = ({ data = [] }: ActivityTimelineProps) => {
  return (
    <Card>
      <CardHeader
        avatar={ICON_MAP['list-details']}
        title='Activity Timeline'
        titleTypographyProps={{ variant: 'h5' }}
        action={<OptionMenu options={['Share timeline', 'Suggest edits', 'Report bug']} />}
        sx={{ '& .MuiCardHeader-avatar': { mr: 3 } }}
      />
      <CardContent className='flex flex-col gap-6 pbe-5'>
        <Timeline>
          {data.map((item) => (
            <TimelineItem key={item.id}>
              <TimelineSeparator>
                <TimelineDot color={item.iconColor as 'primary' | 'success' | 'info' | 'error' | 'warning' | 'secondary'} />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                  <Typography className='font-medium' color='text.primary'>
                    {item.title}
                  </Typography>
                  <Typography variant='caption'>{item.timeAgo}</Typography>
                </div>
                <Typography className='mbe-2'>{item.description}</Typography>
                {item.type === 'invoice-paid' && item.attachment && (
                  <div className='flex items-center gap-2.5 is-fit rounded bg-actionHover plb-[5px] pli-2.5'>
                    <img height={20} alt={item.attachment.name} src={item.attachment.src} />
                    <Typography className='font-medium'>{item.attachment.name}</Typography>
                  </div>
                )}
                {item.type === 'meeting' && item.avatar && (
                  <div className='flex items-center gap-2.5'>
                    <Avatar src={item.avatar.src} className='is-8 bs-8' />
                    <div className='flex flex-col flex-wrap'>
                      <Typography variant='body2' className='font-medium'>
                        {item.avatar.name}
                      </Typography>
                      <Typography variant='body2'>{item.avatar.role}</Typography>
                    </div>
                  </div>
                )}
                {item.type === 'project' && item.avatars && (
                  <AvatarGroup total={item.totalMembers} className='pull-up'>
                    {item.avatars.map((avatar, index) => (
                      <Avatar key={index} alt={avatar.name} src={avatar.src} />
                    ))}
                  </AvatarGroup>
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default ActivityTimeline
