// Type Imports
import type {
  EcommerceEarningReport,
  EcommercePopularProduct,
  EcommerceTransaction
} from '@galaxy/types/apps/ecommerceDashboardTypes'

export const db: {
  popularProducts: EcommercePopularProduct[]
  transactions: EcommerceTransaction[]
  earningReports: EcommerceEarningReport[]
} = {
  popularProducts: [
    {
      title: 'Apple iPhone 13',
      subtitle: '4567',
      amount: '$999.29',
      imgSrc: '/images/cards/apple-iPhone-13.png'
    },
    {
      title: 'Nike Air Jordan',
      subtitle: '3456',
      amount: '$72.40',
      imgSrc: '/images/cards/nike-air-jordan.png'
    },
    {
      title: 'Beats Studio 2',
      subtitle: '9485',
      amount: '$99.90',
      imgSrc: '/images/cards/beats-studio-2.png'
    },
    {
      title: 'Apple Watch Series 7',
      subtitle: '2345',
      amount: '$249.99',
      imgSrc: '/images/cards/apple-watch-series-7.png'
    },
    {
      title: 'Amazon Echo Dot',
      subtitle: '8959',
      amount: '$79.40',
      imgSrc: '/images/cards/amazon-echo-dot.png'
    },
    {
      title: 'PlayStation Console',
      subtitle: '7892',
      amount: '$129.48',
      imgSrc: '/images/cards/play-station-console.png'
    }
  ],
  transactions: [
    {
      title: 'Wallet',
      subtitle: 'Starbucks',
      amount: 75,
      amountDiff: 'negative',
      avatarColor: 'primary',
      avatarIcon: 'tabler-wallet'
    },
    {
      title: 'Bank Transfer',
      subtitle: 'Add Money',
      amount: 480,
      avatarColor: 'success',
      avatarIcon: 'tabler-browser-check'
    },
    {
      title: 'PayPal',
      subtitle: 'Client Payment',
      amount: 268,
      avatarColor: 'error',
      avatarIcon: 'tabler-brand-paypal'
    },
    {
      title: 'Master Card',
      subtitle: 'Ordered iPhone 13',
      amount: 699,
      amountDiff: 'negative',
      avatarColor: 'secondary',
      avatarIcon: 'tabler-credit-card'
    },
    {
      title: 'Bank Transaction',
      subtitle: 'Refund',
      amount: 98,
      avatarColor: 'info',
      avatarIcon: 'tabler-currency-dollar'
    },
    {
      title: 'PayPal',
      subtitle: 'Client Payment',
      amount: 126,
      avatarColor: 'error',
      avatarIcon: 'tabler-brand-paypal'
    },
    {
      title: 'Bank Transfer',
      subtitle: 'Pay Office Rent',
      amount: 1290,
      amountDiff: 'negative',
      avatarColor: 'success',
      avatarIcon: 'tabler-browser-check'
    }
  ],
  earningReports: [
    {
      amount: '$1,619',
      trendNumber: 18.6,
      title: 'Net Profit',
      avatarColor: 'primary',
      subtitle: '12.4k Sales',
      avatarIcon: 'tabler-chart-pie-2'
    },
    {
      amount: '$3,571',
      trendNumber: 39.6,
      title: 'Total Income',
      avatarColor: 'success',
      subtitle: 'Sales, Affiliation',
      avatarIcon: 'tabler-currency-dollar'
    },
    {
      amount: '$430',
      trendNumber: 52.8,
      title: 'Total Expenses',
      avatarColor: 'secondary',
      subtitle: 'ADVT, Marketing',
      avatarIcon: 'tabler-credit-card'
    }
  ]
}
