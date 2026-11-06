// Type Imports
import type {
  AdvancedSalesByCountry,
  WidgetBrowserState,
  WidgetVehicleCondition,
  WidgetEarningReport,
  WidgetTransaction,
  WidgetOrdersData,
  WidgetDeliveryPerformance,
  WidgetTopCourse,
  WidgetPopularInstructor,
  WidgetUpcomingWebinar,
  WidgetAssignmentProgress
} from '@galaxy/types/pages/widgetExamplesAdvancedTypes'

export const db: {
  salesByCountries: AdvancedSalesByCountry[]
  vehicleConditions: WidgetVehicleCondition[]
  browserStates: WidgetBrowserState[]
  widgetEarningReports: WidgetEarningReport[]
  transactions: WidgetTransaction[]
  orders: WidgetOrdersData
  deliveryPerformance: WidgetDeliveryPerformance[]
  topCourses: WidgetTopCourse[]
  popularInstructors: WidgetPopularInstructor[]
  upcomingWebinar: WidgetUpcomingWebinar[]
  assignmentProgress: WidgetAssignmentProgress[]
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
  ],
  widgetEarningReports: [
    { amount: '$1,619', trendNumber: 18.6, title: 'Net Profit', avatarColor: 'primary', subtitle: '12.4k Sales', avatarIcon: 'tabler-chart-pie-2' },
    { amount: '$3,571', trendNumber: 39.6, title: 'Total Income', avatarColor: 'success', subtitle: 'Sales, Affiliation', avatarIcon: 'tabler-currency-dollar' },
    { amount: '$430', trendNumber: 52.8, title: 'Total Expenses', avatarColor: 'secondary', subtitle: 'ADVT, Marketing', avatarIcon: 'tabler-credit-card' }
  ],
  transactions: [
    { title: 'Wallet', subtitle: 'Starbucks', amount: 75, amountDiff: 'negative', avatarColor: 'primary', avatarIcon: 'tabler-wallet' },
    { title: 'Bank Transfer', subtitle: 'Add Money', amount: 480, avatarColor: 'success', avatarIcon: 'tabler-browser-check' },
    { title: 'PayPal', subtitle: 'Client Payment', amount: 268, avatarColor: 'error', avatarIcon: 'tabler-brand-paypal' },
    { title: 'Master Card', subtitle: 'Ordered iPhone 13', amount: 699, amountDiff: 'negative', avatarColor: 'secondary', avatarIcon: 'tabler-credit-card' },
    { title: 'Bank Transaction', subtitle: 'Refund', amount: 98, avatarColor: 'info', avatarIcon: 'tabler-currency-dollar' },
    { title: 'PayPal', subtitle: 'Client Payment', amount: 126, avatarColor: 'error', avatarIcon: 'tabler-brand-paypal' },
    { title: 'Bank Transfer', subtitle: 'Pay Office Rent', amount: 1290, amountDiff: 'negative', avatarColor: 'success', avatarIcon: 'tabler-browser-check' }
  ],
  orders: {
    new: [
      { sender: { name: 'Micheal Hughes', address: '101 Boulder, California (CA), 933130' }, receiver: { name: 'Daisy Coleman', address: '939 Orange, California (CA), 910614' } },
      { sender: { name: 'Glenn Todd', address: '1713 Garnet, California (CA), 939573' }, receiver: { name: 'Arthur West', address: '156 Blaze, California (CA), 925878' } }
    ],
    preparing: [
      { sender: { name: 'Rose Cole', address: '61 Unions, California (CA), 922523' }, receiver: { name: 'Polly Spencer', address: '865 Delta, California (CA), 932830' } },
      { sender: { name: 'Jerry Wood', address: '37 Marjory, California (CA), 951958' }, receiver: { name: 'Sam McCormick', address: '926 Reynolds, California (CA), 910279' } }
    ],
    shipping: [
      { sender: { name: 'Alex Walton', address: '78 Judson, California (CA), 956084' }, receiver: { name: 'Eula Griffin', address: '56 Bernard, California (CA), 965133' } },
      { sender: { name: 'Lula Barton', address: '95 Gaylord, California (CA), 991955' }, receiver: { name: 'Craig Jacobs', address: '73 Sandy, California (CA), 954566' } }
    ]
  },
  deliveryPerformance: [
    { title: 'Packages in transit', value: '10k', change: 25.8, icon: 'tabler-box', color: 'primary' },
    { title: 'Packages out for delivery', value: '5k', change: 4.3, icon: 'tabler-truck', color: 'info' },
    { title: 'Packages delivered', value: '15k', change: -12.5, icon: 'tabler-circle-check', color: 'success' },
    { title: 'Delivery success rate', value: '95%', change: 35.6, icon: 'tabler-percentage', color: 'warning' },
    { title: 'Average delivery time', value: '2.5 Days', change: -2.15, icon: 'tabler-clock', color: 'secondary' },
    { title: 'Customer satisfaction', value: '4.5/5', change: 5.7, icon: 'tabler-users', color: 'error' }
  ],
  topCourses: [
    { title: 'Videography Basic Design Course', views: '1.2k', icon: 'tabler-video', color: 'primary' },
    { title: 'Basic Front-end Development Course', views: '834', icon: 'tabler-code', color: 'info' },
    { title: 'Basic Fundamentals of Photography', views: '3.7k', icon: 'tabler-camera', color: 'success' },
    { title: 'Advance Dribble Base Visual Design', views: '2.5k', icon: 'tabler-brand-dribbble', color: 'warning' },
    { title: 'Your First Singing Lesson', views: '948', icon: 'tabler-microphone-2', color: 'error' }
  ],
  popularInstructors: [
    { name: 'Jordan Stevenson', profession: 'Business Intelligence', totalCourses: 33, avatar: '/images/avatars/1.png' },
    { name: 'Bentlee Emblin', profession: 'Digital Marketing', totalCourses: 52, avatar: '/images/avatars/2.png' },
    { name: 'Benedetto Rossiter', profession: 'UI/UX Design', totalCourses: 12, avatar: '/images/avatars/3.png' },
    { name: 'Beverlie Krabbe', profession: 'Vue', totalCourses: 8, avatar: '/images/avatars/4.png' },
    { name: 'Emma Bowen', profession: 'React Native', totalCourses: 9, avatar: '/images/avatars/3.png' },
    { name: 'Amy Patterson', profession: 'Java Developer', totalCourses: 10, avatar: '/images/avatars/6.png' }
  ],
  upcomingWebinar: [
    { icon: 'tabler-calendar', title: '17 Nov 23', value: 'Date' },
    { icon: 'tabler-clock', title: '32 Minutes', value: 'Duration' }
  ],
  assignmentProgress: [
    { title: 'User Experience Design', tasks: 120, progress: 72, color: 'primary' },
    { title: 'Basic fundamentals', tasks: 32, progress: 48, color: 'success' },
    { title: 'React Native components', tasks: 182, progress: 15, color: 'error' },
    { title: 'Basic of music theory', tasks: 56, progress: 24, color: 'info' }
  ]
}
