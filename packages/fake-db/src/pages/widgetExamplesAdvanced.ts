// Type Imports
import type { AdvancedSalesByCountry, WidgetBrowserState, WidgetVehicleCondition } from '@galaxy/types/pages/widgetExamplesAdvancedTypes'

export const db: {
  salesByCountries: AdvancedSalesByCountry[]
  vehicleConditions: WidgetVehicleCondition[]
  browserStates: WidgetBrowserState[]
} = {
  salesByCountries: [
    { title: '$8.45k', subtitle: 'United States', trendNumber: 25.8, imgSrc: '/images/cards/us.png' },
    { title: '$7.78k', subtitle: 'Brazil', trendNumber: 16.2, trend: 'negative', imgSrc: '/images/cards/brazil.png' },
    { title: '$6.48k', subtitle: 'India', trendNumber: 12.3, imgSrc: '/images/cards/india.png' },
    { title: '$5.12k', subtitle: 'Australia', trendNumber: 11.9, trend: 'negative', imgSrc: '/images/cards/australia.png' },
    { title: '$4.45k', subtitle: 'France', trendNumber: 16.2, imgSrc: '/images/cards/france.png' },
    { title: '$3.90k', subtitle: 'China', trendNumber: 14.8, imgSrc: '/images/cards/china.png' }
  ],
  vehicleConditions: [
    { title: 'Incorrect address', subtitle: 'All exceptions', progress: 83, color: 'success', chipLabel: '+10' },
    { title: 'Good', subtitle: '24 Vehicles', progress: 11, color: 'info', chipLabel: '+9.1' },
    { title: 'Average', subtitle: '14 Vehicles', progress: 8, color: 'primary', chipLabel: '+2.5' },
    { title: 'Bad', subtitle: '8 Vehicles', progress: 6, color: 'warning', chipLabel: '-3.4' },
    { title: 'Not Working', subtitle: '4 Vehicles', progress: 2, color: 'error', chipLabel: '-12.6' }
  ],
  browserStates: [
    { title: 'Google Chrome', progress: 67, percentage: '54.4%', progressColor: 'primary', imgSrc: '/images/logos/google-chrome.png' },
    { title: 'Apple Safari', progress: 40, percentage: '14.6%', progressColor: 'success', imgSrc: '/images/logos/safari.png' },
    { title: 'Mozilla Firefox', progress: 30, percentage: '6.1%', progressColor: 'secondary', imgSrc: '/images/logos/mozilla-firefox.png' },
    { title: 'Opera Mini', progress: 20, percentage: '8.0%', progressColor: 'info', imgSrc: '/images/logos/opera-mini.png' },
    { title: 'Internet Explorer', progress: 15, percentage: '4.2%', progressColor: 'warning', imgSrc: '/images/logos/internet-explorer.png' },
    { title: 'Brave', progress: 15, percentage: '0.3%', progressColor: 'error', imgSrc: '/images/logos/brave.png' }
  ]
}
