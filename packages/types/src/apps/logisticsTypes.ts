export type Vehicle = {
  id: number
  location: number
  startCity: string
  startCountry: string
  endCity: string
  endCountry: string
  warnings: string
  progress: number
}

export type VehicleOverviewType = {
  icon: string
  heading: string
  time: string
  progressColor: string
  progressColorVariant: string
  progressData: string
  widthClass?: string
}

// Type Imports
import type { ThemeColor } from '../base'

export type DeliveryPerformanceItem = {
  title: string
  value: string
  change: number
  icon: string
  color: ThemeColor
}

export type OrderTimelineItem = {
  sender: { name: string; address: string }
  receiver: { name: string; address: string }
}

export type OrderTimeline = Record<'new' | 'preparing' | 'shipping', OrderTimelineItem[]>

export type VehicleTrackingDataType = {
  name: string
  location: string
  progress: number
  driverName: string
  passengerName: string
}

export type logisticsType = {
  vehicles: Vehicle[]
  vehicleOverview: VehicleOverviewType[]
  deliveryPerformance: DeliveryPerformanceItem[]
  ordersByCountries: OrderTimeline
  vehicleTracking: VehicleTrackingDataType[]
}


export const __MARKER_XYZ = 'seen';
