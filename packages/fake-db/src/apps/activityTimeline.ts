export type ActivityTimelineItem = {
  id: number
  type: 'invoice-paid' | 'meeting' | 'project'
  title: string
  timeAgo: string
  description: string
  iconColor: string
  attachment?: {
    name: string
    src: string
  }
  avatar?: {
    name: string
    role: string
    src: string
  }
  avatars?: {
    name: string
    src: string
  }[]
  totalMembers?: number
}

export const activityTimeline: ActivityTimelineItem[] = [
  {
    id: 1,
    type: 'invoice-paid',
    title: '12 Invoices have been paid',
    timeAgo: '12 min ago',
    description: 'Invoices have been paid to the company',
    iconColor: 'primary',
    attachment: {
      name: 'invoices.pdf',
      src: '/images/icons/pdf-document.png'
    }
  },
  {
    id: 2,
    type: 'meeting',
    title: 'Client Meeting',
    timeAgo: '45 min ago',
    description: 'Project meeting with john @10:15am',
    iconColor: 'success',
    avatar: {
      name: 'Lester McCarthy (Client)',
      role: 'CEO of Pixinvent',
      src: '/images/avatars/1.png'
    }
  },
  {
    id: 3,
    type: 'project',
    title: 'Create a new project for client',
    timeAgo: '2 Day Ago',
    description: '6 team members in a project',
    iconColor: 'info',
    avatars: [
      { name: 'Travis Howard', src: '/images/avatars/1.png' },
      { name: 'Agnes Walker', src: '/images/avatars/4.png' },
      { name: 'John Doe', src: '/images/avatars/2.png' }
    ],
    totalMembers: 6
  }
]