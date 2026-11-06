// Type Imports
import type { ActiveProject, LastTransaction, SalesByCountry } from '@galaxy/types/apps/dashboardTypes'

export const db: {
  lastTransactions: LastTransaction[]
  activeProjects: ActiveProject[]
  salesByCountries: SalesByCountry[]
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
  ]
}
