// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Component Imports
import DistributedBarChartOrder from '@views/dashboards/crm/DistributedBarChartOrder'
import LineAreaYearlySalesChart from '@views/dashboards/crm/LineAreaYearlySalesChart'
import CardStatVertical from '@/components/card-statistics/Vertical'
import BarChartRevenueGrowth from '@views/dashboards/crm/BarChartRevenueGrowth'
import EarningReportsWithTabs from '@views/dashboards/crm/EarningReportsWithTabs'
import RadarSalesChart from '@views/dashboards/crm/RadarSalesChart'
import SalesByCountries from '@views/dashboards/crm/SalesByCountries'
import ProjectStatus from '@views/dashboards/crm/ProjectStatus'
import ActiveProjects from '@views/dashboards/crm/ActiveProjects'
import LastTransaction from '@views/dashboards/crm/LastTransaction'
import ActivityTimeline from '@views/dashboards/crm/ActivityTimeline'
import GalaxyOrbitArtwork from '@/components/brand/GalaxyOrbitArtwork'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'
import { getDashboardData, getActivityTimelineData } from '@/app/server/actions'

const DashboardCRM = async () => {
  // Vars
  const serverMode = await getServerMode()
  const data = await getDashboardData()
  const activityTimelineData = await getActivityTimelineData()

  return (
    <>
      <section className='galaxy-dashboard-intro' aria-labelledby='galaxy-dashboard-title'>
        <div>
          <Typography variant='overline' className='galaxy-dashboard-kicker'>Workspace / Overview</Typography>
          <Typography id='galaxy-dashboard-title' variant='h4' className='galaxy-dashboard-title'>
            Control plane
          </Typography>
          <Typography color='text.secondary'>A live view of the work moving through your Galaxy workspace.</Typography>
        </div>
        <GalaxyOrbitArtwork />
      </section>
      <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <DistributedBarChartOrder />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <LineAreaYearlySalesChart />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Total Profit'
          subtitle='Last Week'
          stats='1.28k'
          avatarColor='error'
          avatarIcon='tabler-credit-card'
          avatarSkin='light'
          avatarSize={44}
          chipText='-12.2%'
          chipColor='error'
          chipVariant='tonal'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Total Sales'
          subtitle='Last Week'
          stats='24.67k'
          avatarColor='success'
          avatarIcon='tabler-currency-dollar'
          avatarSkin='light'
          avatarSize={44}
          chipText='+24.67%'
          chipColor='success'
          chipVariant='tonal'
        />
      </Grid>
      <Grid size={{ xs: 12, md: 8, lg: 4 }}>
        <BarChartRevenueGrowth />
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <EarningReportsWithTabs />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <RadarSalesChart />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SalesByCountries data={data.salesByCountries} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <ProjectStatus data={data.projectStatuses} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <ActiveProjects data={data.activeProjects} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <LastTransaction data={data.lastTransactions} serverMode={serverMode} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ActivityTimeline data={activityTimelineData} />
      </Grid>
      </Grid>
    </>
  )
}

export default DashboardCRM
