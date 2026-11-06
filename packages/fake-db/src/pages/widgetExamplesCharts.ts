// Type Imports
import type { WidgetVehicleOverview } from '@galaxy/types/pages/widgetExamplesChartsTypes'

export const db: { vehicleOverview: WidgetVehicleOverview[] } = {
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
  ]
}
