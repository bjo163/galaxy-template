// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports
import MonthlyCampaignState from '@views/pages/widget-examples/advanced/MonthlyCampaignState'
import ActiveProjects from '@views/pages/widget-examples/advanced/ActiveProjects'
import SourceVisits from '@views/pages/widget-examples/advanced/SourceVisits'
import SalesByCountries from '@views/pages/widget-examples/advanced/SalesByCountries'
import EarningReports from '@views/pages/widget-examples/advanced/EarningReports'
import BrowserStates from '@views/pages/widget-examples/advanced/BrowserStates'
import Orders from '@views/pages/widget-examples/advanced/Orders'
import Transactions from '@views/pages/widget-examples/advanced/Transactions'
import PopularProducts from '@views/pages/widget-examples/advanced/PopularProducts'
import TopCourses from '@views/pages/widget-examples/advanced/TopCourses'
import UpcomingWebinar from '@views/pages/widget-examples/advanced/UpcomingWebinar'
import AssignmentProgress from '@views/pages/widget-examples/advanced/AssignmentProgress'
import DeliveryPerformance from '@views/pages/widget-examples/advanced/DeliveryPerformance'
import VehicleCondition from '@views/pages/widget-examples/advanced/VehicleCondition'
import PopularInstructors from '@views/pages/widget-examples/advanced/PopularInstructors'
import LastTransaction from '@views/pages/widget-examples/advanced/LastTransaction'
import ActivityTimeline from '@views/pages/widget-examples/advanced/ActivityTimeline'
import WebsiteAnalyticsSlider from '@views/pages/widget-examples/advanced/WebsiteAnalyticsSlider'
import Congratulations from '@/views/pages/widget-examples/advanced/Congratulations'

// Server Action Imports
import { getDashboardData, getEcommerceDashboardData, getWidgetExamplesAdvancedData, getActivityTimelineData } from '@/app/server/actions'
import { getServerMode } from '@core/utils/serverHelpers'

const Advanced = async () => {
  // Vars
  const serverMode = await getServerMode()
  const dashboardData = await getDashboardData()
  const ecommerceDashboardData = await getEcommerceDashboardData()
  const advancedData = await getWidgetExamplesAdvancedData()
  const activityTimelineData = await getActivityTimelineData()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <MonthlyCampaignState data={dashboardData.monthlyCampaignStates} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <ActiveProjects data={dashboardData.activeProjects} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SourceVisits data={dashboardData.sourceVisits} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SalesByCountries data={advancedData.salesByCountries} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <EarningReports data={advancedData.widgetEarningReports} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <BrowserStates data={advancedData.browserStates} />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Orders data={advancedData.orders} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Transactions data={advancedData.transactions} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <PopularProducts data={ecommerceDashboardData.popularProducts} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <TopCourses data={advancedData.topCourses} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <UpcomingWebinar data={advancedData.upcomingWebinar} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <AssignmentProgress data={advancedData.assignmentProgress} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <DeliveryPerformance data={advancedData.deliveryPerformance} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <VehicleCondition data={advancedData.vehicleConditions} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <PopularInstructors data={advancedData.popularInstructors} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <LastTransaction data={dashboardData.lastTransactions} serverMode={serverMode} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ActivityTimeline data={activityTimelineData} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <WebsiteAnalyticsSlider data={dashboardData.websiteAnalyticsSlides} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Congratulations />
      </Grid>
    </Grid>
  )
}

export default Advanced
