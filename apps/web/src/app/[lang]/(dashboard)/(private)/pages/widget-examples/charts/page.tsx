// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports
import EarningReports from '@views/pages/widget-examples/charts/EarningReports'
import SupportTracker from '@views/pages/widget-examples/charts/SupportTracker'
import Sales from '@views/pages/widget-examples/charts/Sales'
import RevenueReport from '@views/pages/widget-examples/charts/RevenueReport'
import ProjectStatus from '@views/pages/widget-examples/charts/ProjectStatus'
import EarningReportsWithTabs from '@views/pages/widget-examples/charts/EarningReportsWithTabs'
import TotalEarning from '@views/pages/widget-examples/charts/TotalEarning'
import CarrierPerformance from '@views/pages/widget-examples/charts/CarrierPerformance'
import DeliveryExceptions from '@views/pages/widget-examples/charts/DeliveryExceptions'
import VehicleOverview from '@views/pages/widget-examples/charts/VehicleOverview'
import InterestedTopics from '@views/pages/widget-examples/charts/InterestedTopics'

// Data Imports
import { getDashboardData, getWidgetExamplesChartsData } from '@/app/server/actions'

const Charts = async () => {
  // Vars
  const chartsData = await getWidgetExamplesChartsData()
  const dashboardData = await getDashboardData()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 6 }}>
        <EarningReports data={dashboardData.earningReports} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <SupportTracker data={dashboardData.supportTracker} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Sales />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <RevenueReport />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <ProjectStatus data={dashboardData.projectStatuses} />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <EarningReportsWithTabs />
      </Grid>
      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <TotalEarning data={dashboardData.totalEarnings} />
      </Grid>
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <CarrierPerformance />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <DeliveryExceptions />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 8 }}>
        <VehicleOverview data={chartsData.vehicleOverview} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <InterestedTopics data={chartsData.interestedTopics} />
      </Grid>
    </Grid>
  )
}

export default Charts
