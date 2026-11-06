// Type Imports
import type { EcommercePopularProduct } from '@galaxy/types/apps/ecommerceDashboardTypes'

export const db: { popularProducts: EcommercePopularProduct[] } = {
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
  ]
}
