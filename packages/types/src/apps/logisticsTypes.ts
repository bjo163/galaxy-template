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

export type logisticsType = {
  vehicles: Vehicle[]
  vehicleOverview: VehicleOverviewType[]
}
