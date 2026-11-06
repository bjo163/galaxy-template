import type {
  RecentDeviceItem,
  ConnectedAccount,
  SocialAccount,
  PaymentMethodCard
} from '@galaxy/types/apps/userViewTypes'
import type { ApiKeyItem } from '@galaxy/types/pages/accountSettingsTypes'

export const db: {
  recentDevices: RecentDeviceItem[]
  apiKeys: ApiKeyItem[]
  connectedAccounts: ConnectedAccount[]
  socialAccounts: SocialAccount[]
  paymentMethods: PaymentMethodCard[]
} = {
  recentDevices: [
    {
      device: 'HP Spectre 360',
      location: 'Switzerland',
      browser: 'Chrome on Windows',
      recentActivity: '10, Sept 20:07',
      browserIcon: 'windows'
    },
    {
      device: 'Google Pixel 3a',
      location: 'Los Angeles, CA',
      browser: 'Chrome on Android',
      recentActivity: '20 Apr 2022, 10:20',
      browserIcon: 'android'
    },
    {
      device: 'iPhone 12x',
      location: 'San Francisco, CA',
      browser: 'Chrome on iPhone',
      recentActivity: '16 Apr 2022, 04:20',
      browserIcon: 'mobile'
    },
    {
      device: 'Apple iMac',
      location: 'India',
      browser: 'Chrome on MacOS',
      recentActivity: '28 Apr 2022, 18:20',
      browserIcon: 'apple'
    },
    {
      device: 'Macbook Pro',
      location: 'Switzerland',
      browser: 'Chrome on Windows',
      recentActivity: '20 Apr 2022, 10:20',
      browserIcon: 'apple'
    },
    {
      device: 'Oneplus 9 Pro',
      location: 'Dubai',
      browser: 'Chrome on Android',
      recentActivity: '16 Apr 2022, 04:20',
      browserIcon: 'android'
    }
  ],
  apiKeys: [
    {
      title: 'Server Key 1',
      access: 'Full Access',
      date: '28 Apr 2021, 18:20 GTM+4:10',
      key: '23eaf7f0-f4f7-495e-8b86-fad3261282ac'
    },
    {
      title: 'Server Key 2',
      access: 'Read Only',
      date: '12 Feb 2021, 10:30 GTM+2:30',
      key: 'bb98e571-a2e2-4de8-90a9-2e231b5e99'
    },
    {
      title: 'Server Key 3',
      access: 'Full Access',
      date: '28 Dec 2021, 12:21 GTM+4:10',
      key: '2e915e59-3105-47f2-8838-6e46bf83b711'
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
    { title: 'Linkedin', isConnected: true, username: '@Pixinvent', logo: '/images/logos/linkedin.png', href: 'https://in.linkedin.com/company/pixinvent' },
    { title: 'Dribbble', isConnected: false, logo: '/images/logos/dribbble.png' },
    { title: 'Behance', isConnected: false, logo: '/images/logos/behance.png' }
  ],
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
      name: 'Mildred Wagner',
      expiryDate: '02/24',
      imgAlt: 'Visa card',
      cardNumber: '4532 3616 2070 5678',
      imgSrc: '/images/logos/visa.png'
    }
  ]
}
