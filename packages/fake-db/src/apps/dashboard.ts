// Type Imports
import type {
  ActiveProject,
  EarningReport,
  LastTransaction,
  MonthlyCampaignState,
  ProjectStatusItem,
  SalesByCountry,
  SourceVisit,
  SupportTrackerItem,
  TotalEarning,
  WebsiteAnalyticsSlide
} from '@galaxy/types/apps/dashboardTypes'

export const db: {
  lastTransactions: LastTransaction[]
  activeProjects: ActiveProject[]
  salesByCountries: SalesByCountry[]
  sourceVisits: SourceVisit[]
  monthlyCampaignStates: MonthlyCampaignState[]
  supportTracker: SupportTrackerItem[]
  totalEarnings: TotalEarning[]
  earningReports: EarningReport[]
  websiteAnalyticsSlides: WebsiteAnalyticsSlide[]
  projectStatuses: ProjectStatusItem[]
} = {
  lastTransactions: [
    {
      trend: '+$1,678',
      status: 'verified',
      cardType: 'Credit',
      cardNumber: '*4230',
      imgName: 'visa',
      date: `17 Mar ${new Date().getFullYear()}`
    },
    {
      trend: '-$839',
      status: 'rejected',
      cardType: 'Credit',
      cardNumber: '*5578',
      imgName: 'mastercard',
      date: `12 Feb ${new Date().getFullYear()}`
    },
    {
      trend: '+$435',
      cardType: 'ATM',
      status: 'verified',
      cardNumber: '*4567',
      imgName: 'american-express',
      date: `28 Feb ${new Date().getFullYear()}`
    },
    {
      trend: '+$2,345',
      status: 'pending',
      cardType: 'Credit',
      cardNumber: '*5699',
      imgName: 'visa',
      date: `08 Jan ${new Date().getFullYear()}`
    },
    {
      trend: '+$1,758',
      status: 'rejected',
      cardType: 'Credit',
      cardNumber: '*2451',
      imgName: 'visa',
      date: `19 Oct ${new Date().getFullYear()}`
    }
  ],
  activeProjects: [
    {
      title: 'Laravel',
      subtitle: 'eCommerce',
      progress: 54,
      progressColor: 'error',
      imgSrc: '/images/logos/laravel.png'
    },
    {
      title: 'Figma',
      subtitle: 'App UI Kit',
      progress: 85,
      progressColor: 'primary',
      imgSrc: '/images/logos/figma.png'
    },
    {
      title: 'VusJs',
      subtitle: 'Calendar App',
      progress: 64,
      progressColor: 'success',
      imgSrc: '/images/logos/vue.png'
    },
    {
      title: 'React',
      subtitle: 'Dashboard',
      progress: 40,
      progressColor: 'info',
      imgSrc: '/images/logos/react.png'
    },
    {
      title: 'Bootstrap',
      subtitle: 'Website',
      progress: 17,
      progressColor: 'primary',
      imgSrc: '/images/logos/bootstrap.png'
    },
    {
      title: 'Sketch',
      subtitle: 'Website Design',
      progress: 30,
      progressColor: 'warning',
      imgSrc: '/images/logos/sketch.png'
    }
  ],
  salesByCountries: [
    {
      title: '$8.45k',
      subtitle: 'United States',
      trendNumber: 25.8,
      imgSrc: '/images/cards/us.png'
    },
    {
      title: '$7.78k',
      subtitle: 'Brazil',
      trendNumber: 16.2,
      trend: 'negative',
      imgSrc: '/images/cards/brazil.png'
    },
    {
      title: '$6.48k',
      subtitle: 'India',
      trendNumber: 12.3,
      imgSrc: '/images/cards/india.png'
    },
    {
      title: '$5.12k',
      subtitle: 'Australia',
      trendNumber: 11.9,
      trend: 'negative',
      imgSrc: '/images/cards/australia.png'
    },
    {
      title: '$4.45k',
      subtitle: 'France',
      trendNumber: 16.2,
      imgSrc: '/images/cards/france.png'
    },
    {
      title: '$3.90k',
      subtitle: 'China',
      trendNumber: 14.8,
      imgSrc: '/images/cards/china.png'
    }
  ],
  sourceVisits: [
    {
      title: 'Direct Source',
      subtitle: 'Direct link click',
      amount: '1.2k',
      trendNumber: 4.2,
      icon: 'tabler-shadow'
    },
    {
      title: 'Social Networks',
      subtitle: 'Social Channels',
      amount: '31.5k',
      trendNumber: 8.2,
      icon: 'tabler-globe'
    },
    {
      title: 'Email Newsletter',
      subtitle: 'Mail Campaigns',
      amount: '893',
      trendNumber: 2.4,
      icon: 'tabler-mail'
    },
    {
      title: 'Referrals',
      subtitle: 'Impact Radius Visits',
      amount: '342',
      trendNumber: 0.4,
      trend: 'negative',
      icon: 'tabler-external-link'
    },
    {
      title: 'ADVT',
      subtitle: 'Google ADVT',
      amount: '2.15k',
      trendNumber: 9.1,
      icon: 'tabler-ad'
    },
    {
      title: 'Other',
      subtitle: 'Many Sources',
      amount: '12.5k',
      trendNumber: 6.2,
      icon: 'tabler-star'
    }
  ],
  monthlyCampaignStates: [
    {
      title: 'Emails',
      amount: '12,346',
      trendNumber: '0.3%',
      avatarColor: 'success',
      icon: 'tabler-mail'
    },
    {
      title: 'Opened',
      amount: '8,734',
      trendNumber: '2.1%',
      avatarColor: 'info',
      icon: 'tabler-link'
    },
    {
      title: 'Clicked',
      amount: '967',
      trendNumber: '1.4%',
      trend: 'negative',
      avatarColor: 'warning',
      icon: 'tabler-mouse'
    },
    {
      title: 'Subscribe',
      amount: '345',
      trendNumber: '8.5%',
      avatarColor: 'primary',
      icon: 'tabler-users'
    },
    {
      title: 'Complaints',
      amount: '10',
      trendNumber: '1.5%',
      trend: 'negative',
      avatarColor: 'secondary',
      icon: 'tabler-alert-triangle'
    },
    {
      title: 'Unsubscribe',
      amount: '86',
      trendNumber: '0.8%',
      avatarColor: 'error',
      icon: 'tabler-ban'
    }
  ],
  supportTracker: [
    {
      title: 'New Tickets',
      subtitle: '142',
      avatarColor: 'primary',
      avatarIcon: 'tabler-ticket'
    },
    {
      title: 'Open Tickets',
      subtitle: '28',
      avatarColor: 'info',
      avatarIcon: 'tabler-check'
    },
    {
      title: 'Response Time',
      subtitle: '1 Day',
      avatarColor: 'warning',
      avatarIcon: 'tabler-clock'
    }
  ],
  totalEarnings: [
    {
      title: 'Total Revenue',
      subtitle: 'Client Payment',
      amount: 126,
      avatarColor: 'primary',
      avatarIcon: 'tabler-brand-paypal'
    },
    {
      title: 'Total Sales',
      subtitle: 'Refund',
      amount: 98,
      avatarColor: 'secondary',
      avatarIcon: 'tabler-currency-dollar'
    }
  ],
  earningReports: [
    {
      title: 'Earnings',
      progress: 64,
      stats: '$545.69',
      progressColor: 'primary',
      avatarColor: 'primary',
      avatarIcon: 'tabler-currency-dollar'
    },
    {
      title: 'Profit',
      progress: 59,
      stats: '$256.34',
      progressColor: 'info',
      avatarColor: 'info',
      avatarIcon: 'tabler-chart-pie-2'
    },
    {
      title: 'Expense',
      progress: 22,
      stats: '$74.19',
      progressColor: 'error',
      avatarColor: 'error',
      avatarIcon: 'tabler-brand-paypal'
    }
  ],
  websiteAnalyticsSlides: [
    {
      title: 'Traffic',
      img: '/images/cards/graphic-illustration-1.png',
      details: {
        Sessions: '28%',
        'Page Views': '3.1k',
        Leads: '1.2k',
        Conversions: '12%'
      }
    },
    {
      title: 'Spending',
      img: '/images/cards/graphic-illustration-2.png',
      details: {
        Spend: '12h',
        Orders: '18',
        Order: '127',
        Items: '2.3k'
      }
    },
    {
      title: 'Revenue Sources',
      img: '/images/cards/graphic-illustration-3.png',
      details: {
        Direct: '268',
        Organic: '890',
        Referral: '62',
        Campaign: '1.2k'
      }
    }
  ],
  projectStatuses: [
    {
      title: 'Donates',
      trend: 'negative',
      amount: '$756.26',
      trendDiff: 139.34
    },
    {
      title: 'Podcasts',
      trendDiff: 576.24,
      amount: '$2,207.03'
    }
  ]
}
