import type {
  PaymentMethodCard,
  RecentDeviceItem,
  ConnectedAccount,
  SocialAccount,
  ProjectListItem
} from '@galaxy/types/apps/userViewTypes'

export const db: {
  paymentMethods: PaymentMethodCard[]
  recentDevices: RecentDeviceItem[]
  connectedAccounts: ConnectedAccount[]
  socialAccounts: SocialAccount[]
  projectList: ProjectListItem[]
} = {
  paymentMethods: [
    {
      cardCvv: '587',
      name: 'Tom McBride',
      expiryDate: '12/24',
      imgAlt: 'Mastercard',
      badgeColor: 'primary',
      cardStatus: 'Primary',
      cardNumber: '5577 0000 5577 9865',
      imgSrc: '/images/logos/mastercard.png'
    },
    {
      cardCvv: '681',
      imgAlt: 'Visa card',
      expiryDate: '02/24',
      name: 'Mildred Wagner',
      cardNumber: '4532 3616 2070 5678',
      imgSrc: '/images/logos/visa.png'
    },
    {
      cardCvv: '3845',
      expiryDate: '08/20',
      badgeColor: 'error',
      cardStatus: 'Expired',
      name: 'Lester Jennings',
      imgAlt: 'American Express card',
      cardNumber: '3700 000000 00002',
      imgSrc: '/images/logos/american-express.png'
    }
  ],
  recentDevices: [
    {
      device: 'Dell XPS 15',
      location: 'United States',
      browser: 'Chrome on Windows',
      recentActivity: '10, Jan 2020 20:07',
      browserIcon: 'windows'
    },
    {
      device: 'Google Pixel 3a',
      location: 'Ghana',
      browser: 'Chrome on Android',
      recentActivity: '11, Jan 2020 10:16',
      browserIcon: 'android'
    },
    {
      device: 'Apple iMac',
      location: 'Mayotte',
      browser: 'Chrome on MacOS',
      recentActivity: '11, Jan 2020 12:10',
      browserIcon: 'apple'
    },
    {
      device: 'Apple iPhone XR',
      location: 'Mauritania',
      browser: 'Chrome on iPhone',
      recentActivity: '12, Jan 2020 8:29',
      browserIcon: 'mobile'
    }
  ],
  connectedAccounts: [
    { checked: true, title: 'Google', logo: '/images/logos/google.png', subtitle: 'Calendar and Contacts' },
    { checked: false, title: 'Slack', logo: '/images/logos/slack.png', subtitle: 'Communications' },
    { checked: true, title: 'Github', logo: '/images/logos/github.png', subtitle: 'Manage your Git repositories' },
    { checked: true, title: 'Mailchimp', subtitle: 'Email marketing service', logo: '/images/logos/mailchimp.png' },
    { title: 'Asana', checked: false, subtitle: 'Task Communication', logo: '/images/logos/asana.png' }
  ],
  socialAccounts: [
    { title: 'Facebook', isConnected: false, logo: '/images/logos/facebook.png' },
    { title: 'Twitter', isConnected: true, username: '@Pixinvent', logo: '/images/logos/twitter.png', href: 'https://twitter.com/pixinvents' },
    { title: 'Linkedin', isConnected: true, username: '@Pixinvent', logo: '/images/logos/linkedin.png', href: 'https://www.linkedin.com/company/pixinvent' },
    { title: 'Dribbble', isConnected: false, logo: '/images/logos/dribbble.png' },
    { title: 'Behance', isConnected: false, logo: '/images/logos/behance.png' }
  ],
  projectList: [
    { id: 1, hours: '18:42', progressValue: 78, totalTask: '122/240', progressColor: 'success', projectType: 'React Project', projectTitle: 'BGC eCommerce App', img: '/images/logos/react-bg.png' },
    { id: 2, hours: '20:42', progressValue: 18, totalTask: '9/56', progressColor: 'error', projectType: 'Figma Project', projectTitle: 'Falcon Logo Design', img: '/images/logos/figma-bg.png' },
    { id: 3, hours: '120:87', progressValue: 62, totalTask: '290/320', progressColor: 'primary', projectType: 'VueJs Project', projectTitle: 'Dashboard Design', img: '/images/logos/vue-bg.png' },
    { id: 4, hours: '89:19', progressValue: 8, totalTask: '7/63', progressColor: 'error', projectType: 'Xamarin Project', projectTitle: 'Foodista Mobile App', img: '/images/icons/mobile-bg.png' },
    { id: 5, hours: '230:10', progressValue: 49, totalTask: '120/186', progressColor: 'warning', projectType: 'Python Project', projectTitle: 'Dojo React Project', img: '/images/logos/python-bg.png' },
    { id: 6, hours: '342:41', progressValue: 92, totalTask: '99/109', progressColor: 'success', projectType: 'Sketch Project', projectTitle: 'Blockchain Website', img: '/images/logos/sketch-bg.png' },
    { id: 7, hours: '12:45', progressValue: 88, totalTask: '98/110', progressColor: 'success', projectType: 'HTML Project', projectTitle: 'Hoffman Website', img: '/images/logos/html-bg.png' }
  ]
}
