// Type Imports
import type { BrandingData, ShortcutsData, HeaderNotification } from '@galaxy/types/pages/brandingTypes'

export const db: BrandingData = {
  templateName: 'Vuexy',
  company: {
    name: 'Pixinvent',
    url: 'https://pixinvent.com/'
  },
  copyright: { prefix: '© {year}, Made with ', heart: '❤️', separator: ' by ' },
  footerLinks: [
    { label: 'License', url: 'https://themeforest.net/licenses/standard' },
    { label: 'More Themes', url: 'https://themeforest.net/user/pixinvent/portfolio' },
    {
      label: 'Documentation',
      url: 'https://demos.pixinvent.com/vuexy-nextjs-admin-template/documentation'
    },
    { label: 'Support', url: 'https://pixinvent.ticksy.com' }
  ],
  socialLinks: [
    { icon: 'tabler-brand-github-filled', url: 'https://github.com/pixinvent' },
    { icon: 'tabler-brand-facebook-filled', url: 'https://www.facebook.com/pixinvents/' },
    { icon: 'tabler-brand-twitter-filled', url: 'https://x.com/pixinvents' },
    {
      icon: 'tabler-brand-youtube-filled',
      url: 'https://www.youtube.com/channel/UClOcB3o1goJ293ri_Hxpklg'
    }
  ],
  marketing: {
    description:
      'Most Powerful & Comprehensive 🤩 React NextJS Admin Template with Elegant Material Design & Unique Layouts.',
    newsletter: {
      label: 'Subscribe to newsletter',
      placeholder: 'Your email',
      button: 'Subscribe'
    },
    appStoreLinks: [
      {
        iconImg: '/images/front-pages/apple-icon.png',
        iconAlt: 'apple store',
        overline: 'Download on the',
        title: 'App Store'
      },
      {
        iconImg: '/images/front-pages/google-play-icon.png',
        iconAlt: 'Google play',
        overline: 'Download on the',
        title: 'Google Play'
      }
    ],
    pagesColumn: {
      title: 'Pages',
      links: [
        { label: 'Pricing', url: '/front-pages/pricing' },
        { label: 'Payment', url: '/front-pages/payment', isNew: true },
        { label: 'Maintenance', url: '/pages/misc/under-maintenance' },
        { label: 'Coming Soon', url: '/pages/misc/coming-soon' }
      ]
    },
    productsColumn: {
      title: 'Products',
      links: [
        { label: 'Page builder', url: '/front-pages/landing-page' },
        { label: 'Admin Dashboards', url: '/front-pages/landing-page' },
        { label: 'UI Kits', url: '/front-pages/landing-page' },
        { label: 'Illustrations', url: '/front-pages/landing-page' }
      ]
    }
  }
}

export const dbShortcuts: ShortcutsData[] = [
  { url: '/apps/calendar', icon: 'tabler-calendar', title: 'Calendar', subtitle: 'Appointments' },
  { url: '/apps/invoice/list', icon: 'tabler-file-dollar', title: 'Invoice App', subtitle: 'Manage Accounts' },
  { url: '/apps/user/list', icon: 'tabler-user', title: 'Users', subtitle: 'Manage Users' },
  { url: '/apps/roles', icon: 'tabler-users-group', title: 'Role Management', subtitle: 'Permissions' },
  { url: '/', icon: 'tabler-device-desktop-analytics', title: 'Dashboard', subtitle: 'User Dashboard' },
  { url: '/pages/account-settings', icon: 'tabler-settings', title: 'Settings', subtitle: 'Account Settings' }
]

export const dbNotifications: HeaderNotification[] = [
  {
    avatarImage: '/images/avatars/8.png',
    title: 'Congratulations Flora 🎉',
    subtitle: 'Won the monthly bestseller gold badge',
    time: '1h ago',
    read: false
  },
  {
    title: 'Cecilia Becker',
    avatarColor: 'secondary',
    subtitle: 'Accepted your connection',
    time: '12h ago',
    read: false
  },
  {
    avatarImage: '/images/avatars/3.png',
    title: 'Bernard Woods',
    subtitle: 'You have new message from Bernard Woods',
    time: 'May 18, 8:26 AM',
    read: true
  },
  {
    avatarIcon: 'tabler-chart-bar',
    title: 'Monthly report generated',
    subtitle: 'July month financial report is generated',
    avatarColor: 'info',
    time: 'Apr 24, 10:30 AM',
    read: true
  },
  {
    avatarText: 'MG',
    title: 'Application has been approved 🚀',
    subtitle: 'Your Meta Gadgets project application has been approved.',
    avatarColor: 'success',
    time: 'Feb 17, 12:17 PM',
    read: true
  },
  {
    avatarIcon: 'tabler-mail',
    title: 'New message from Harry',
    subtitle: 'You have new message from Harry',
    avatarColor: 'error',
    time: 'Jan 6, 1:48 PM',
    read: true
  }
]
