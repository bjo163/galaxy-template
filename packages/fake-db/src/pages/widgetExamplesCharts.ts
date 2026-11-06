// Type Imports
import type { WidgetVehicleOverview, WidgetInterestedTopic } from '@galaxy/types/pages/widgetExamplesChartsTypes'

export const db: {
  vehicleOverview: WidgetVehicleOverview[]
  interestedTopics: WidgetInterestedTopic[]
} = {
  vehicleOverview: [
    {
      icon: 'tabler-car',
      heading: 'On the way',
      time: '2hr 10min',
      progressColor: 'action',
      progressColorVariant: 'hover',
      progressData: '39.7%',
      widthClass: 'is-[39.7%]'
    },
    {
      icon: 'tabler-circle-arrow-down',
      heading: 'Unloading',
      time: '3hr 15min',
      progressColor: 'primary',
      progressColorVariant: 'main',
      progressData: '28.3%',
      widthClass: 'is-[28.3%]'
    },
    {
      icon: 'tabler-circle-arrow-up',
      heading: 'Loading',
      time: '1hr 24min',
      progressColor: 'info',
      progressColorVariant: 'main',
      progressData: '17.4%',
      widthClass: 'is-[17.4%]'
    },
    {
      icon: 'tabler-clock',
      heading: 'Waiting',
      time: '5hr 19min',
      progressColor: 'SnackbarContent',
      progressColorVariant: 'bg',
      progressData: '14.6%',
      widthClass: 'is-[14.6%]'
    }
  ],
  interestedTopics: [
    { title: 'UI Design', value: 35, colorClass: 'text-primary' },
    { title: 'UX Design', value: 20, colorClass: 'text-info' },
    { title: 'Music', value: 14, colorClass: 'text-success' },
    { title: 'Animation', value: 12, colorClass: 'text-secondary' },
    { title: 'React', value: 10, colorClass: 'text-error' },
    { title: 'SEO', value: 9, colorClass: 'text-warning' }
  ]
}
