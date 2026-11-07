'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import { styled } from '@mui/material/styles'
import MuiTimeline from '@mui/lab/Timeline'
import type { TimelineProps } from '@mui/lab/Timeline'

//Component Imports
import { CustomAvatar } from '@galaxy/ui'

// Type Imports
import type { ActivityTimelineItem } from '@galaxy/fake-db/apps/activityTimeline'

import { ICON_MAP } from '@/app/client/iconMap'

// Styled Components
const Timeline = styled(MuiTimeline)<TimelineProps>({
  '& .MuiTimelineItem-root': {
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
        title='Activity Timeline'
        avatar={ICON_MAP['chart-bar']}
        titleTypographyProps={{ variant: 'h5' }}
      />
      <CardContent>
        <Timeline>
          {data.map((item) => (
            <TimelineItem key={item.id}>
              <TimelineSeparator>
                <TimelineDot color={item.iconColor as 'primary' | 'success' | 'info' | 'error' | 'warning' | 'secondary'} />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <div className='flex items-center justify-between flex-wrap gap-x-4 pbe-[7px]'>
                  <Typography className='text-textPrimary font-medium'>{item.title}</Typography>
                  <Typography variant='caption'>{item.timeAgo}</Typography>
                </div>
                <Typography className='mbe-2'>{item.description}</Typography>
                {item.type === 'invoice-paid' && item.attachment && (
                  <div className='flex'>
                    <div className='flex gap-2.5 items-center pli-2.5 bg-actionHover plb-[0.3125rem] rounded'>
                      <img alt={item.attachment.name} src={item.attachment.src} className='bs-5' />
                      <Typography className='font-medium'>{item.attachment.name}</Typography>
                    </div>
                  </div>
                )}
                {item.type === 'meeting' && item.avatar && (
                  <div className='flex items-center gap-2.5'>
                    <CustomAvatar src={item.avatar.src} size={32} />
                    <div>
                      <Typography className='font-medium' variant='body2'>
                        {item.avatar.name}
                      </Typography>
                      <Typography variant='body2'>{item.avatar.role}</Typography>
                    </div>
                  </div>
                )}
                {item.type === 'project' && item.avatars && (
                  <AvatarGroup total={item.totalMembers}>
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
