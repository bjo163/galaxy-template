// Type Imports
import type { MenuLabels, MenuNodeData } from '@galaxy/types/navigation/menuDataTypes'

const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? ''

const EXTERNAL_SUFFIX = { icon: 'tabler-external-link text-xl' } as const

// Vertical navigation menu — plain-data twin of the former
// apps/web/src/data/navigation/verticalMenuData.tsx
export const verticalMenuData = (labels: MenuLabels): MenuNodeData[] => [
  {
    label: labels.dashboards,
    suffix: { label: '5', color: 'error' },
    icon: 'tabler-smart-home',
    children: [
      { label: labels.crm, icon: 'tabler-circle', href: '/dashboards/crm' },
      { label: labels.analytics, icon: 'tabler-circle', href: '/dashboards/analytics' },
      { label: labels.eCommerce, icon: 'tabler-circle', href: '/dashboards/ecommerce' },
      { label: labels.academy, icon: 'tabler-circle', href: '/dashboards/academy' },
      { label: labels.logistics, icon: 'tabler-circle', href: '/dashboards/logistics' }
    ]
  },
  {
    label: labels.frontPages,
    icon: 'tabler-files',
    children: [
      { label: labels.landing, href: '/front-pages/landing-page', target: '_blank', excludeLang: true },
      { label: labels.pricing, href: '/front-pages/pricing', target: '_blank', excludeLang: true },
      { label: labels.payment, href: '/front-pages/payment', target: '_blank', excludeLang: true },
      { label: labels.checkout, href: '/front-pages/checkout', target: '_blank', excludeLang: true },
      { label: labels.helpCenter, href: '/front-pages/help-center', target: '_blank', excludeLang: true }
    ]
  },
  {
    label: labels.appsPages,
    isSection: true,
    children: [
      {
        label: labels.eCommerce,
        icon: 'tabler-shopping-cart',
        children: [
          { label: labels.dashboard, href: '/apps/ecommerce/dashboard' },
          {
            label: labels.products,
            children: [
              { label: labels.list, href: '/apps/ecommerce/products/list' },
              { label: labels.add, href: '/apps/ecommerce/products/add' },
              { label: labels.category, href: '/apps/ecommerce/products/category' }
            ]
          },
          {
            label: labels.orders,
            children: [
              { label: labels.list, href: '/apps/ecommerce/orders/list' },
              {
                label: labels.details,
                href: '/apps/ecommerce/orders/details/5434',
                exactMatch: false,
                activeUrl: '/apps/ecommerce/orders/details'
              }
            ]
          },
          {
            label: labels.customers,
            children: [
              { label: labels.list, href: '/apps/ecommerce/customers/list' },
              {
                label: labels.details,
                href: '/apps/ecommerce/customers/details/879861',
                exactMatch: false,
                activeUrl: '/apps/ecommerce/customers/details'
              }
            ]
          },
          { label: labels.manageReviews, href: '/apps/ecommerce/manage-reviews' },
          { label: labels.referrals, href: '/apps/ecommerce/referrals' },
          { label: labels.settings, href: '/apps/ecommerce/settings' }
        ]
      },
      {
        label: labels.academy,
        icon: 'tabler-school',
        children: [
          { label: labels.dashboard, href: '/apps/academy/dashboard' },
          { label: labels.myCourses, href: '/apps/academy/my-courses' },
          { label: labels.courseDetails, href: '/apps/academy/course-details' }
        ]
      },
      {
        label: labels.logistics,
        icon: 'tabler-truck',
        children: [
          { label: labels.dashboard, href: '/apps/logistics/dashboard' },
          { label: labels.fleet, href: '/apps/logistics/fleet' }
        ]
      },
      {
        label: labels.email,
        icon: 'tabler-mail',
        href: '/apps/email',
        exactMatch: false,
        activeUrl: '/apps/email'
      },
      { label: labels.chat, icon: 'tabler-message-circle-2', href: '/apps/chat' },
      { label: labels.calendar, icon: 'tabler-calendar', href: '/apps/calendar' },
      { label: labels.kanban, icon: 'tabler-copy', href: '/apps/kanban' },
      {
        label: labels.invoice,
        icon: 'tabler-file-description',
        children: [
          { label: labels.list, icon: 'tabler-circle', href: '/apps/invoice/list' },
          {
            label: labels.preview,
            icon: 'tabler-circle',
            href: '/apps/invoice/preview/4987',
            exactMatch: false,
            activeUrl: '/apps/invoice/preview'
          },
          {
            label: labels.edit,
            icon: 'tabler-circle',
            href: '/apps/invoice/edit/4987',
            exactMatch: false,
            activeUrl: '/apps/invoice/edit'
          },
          { label: labels.add, icon: 'tabler-circle', href: '/apps/invoice/add' }
        ]
      },
      {
        label: labels.user,
        icon: 'tabler-user',
        children: [
          { label: labels.list, icon: 'tabler-circle', href: '/apps/user/list' },
          { label: labels.view, icon: 'tabler-circle', href: '/apps/user/view' }
        ]
      },
      {
        label: labels.rolesPermissions,
        icon: 'tabler-lock',
        children: [
          { label: labels.roles, icon: 'tabler-circle', href: '/apps/roles' },
          { label: labels.permissions, icon: 'tabler-circle', href: '/apps/permissions' }
        ]
      },
      {
        label: labels.pages,
        icon: 'tabler-file',
        children: [
          { label: labels.userProfile, icon: 'tabler-circle', href: '/pages/user-profile' },
          { label: labels.accountSettings, icon: 'tabler-circle', href: '/pages/account-settings' },
          { label: labels.faq, icon: 'tabler-circle', href: '/pages/faq' },
          { label: labels.pricing, icon: 'tabler-circle', href: '/pages/pricing' },
          {
            label: labels.miscellaneous,
            icon: 'tabler-circle',
            children: [
              {
                label: labels.comingSoon,
                icon: 'tabler-circle',
                href: '/pages/misc/coming-soon',
                target: '_blank'
              },
              {
                label: labels.underMaintenance,
                icon: 'tabler-circle',
                href: '/pages/misc/under-maintenance',
                target: '_blank'
              },
              { label: labels.pageNotFound404, icon: 'tabler-circle', href: '/pages/misc/404-not-found', target: '_blank' },
              { label: labels.notAuthorized401, icon: 'tabler-circle', href: '/pages/misc/401-not-authorized', target: '_blank' }
            ]
          }
        ]
      },
      {
        label: labels.authPages,
        icon: 'tabler-shield-lock',
        children: [
          {
            label: labels.login,
            icon: 'tabler-circle',
            children: [
              { label: labels.loginV1, icon: 'tabler-circle', href: '/pages/auth/login-v1', target: '_blank' },
              { label: labels.loginV2, icon: 'tabler-circle', href: '/pages/auth/login-v2', target: '_blank' }
            ]
          },
          {
            label: labels.register,
            icon: 'tabler-circle',
            children: [
              {
                label: labels.registerV1,
                icon: 'tabler-circle',
                href: '/pages/auth/register-v1',
                target: '_blank'
              },
              {
                label: labels.registerV2,
                icon: 'tabler-circle',
                href: '/pages/auth/register-v2',
                target: '_blank'
              },
              {
                label: labels.registerMultiSteps,
                icon: 'tabler-circle',
                href: '/pages/auth/register-multi-steps',
                target: '_blank'
              }
            ]
          },
          {
            label: labels.verifyEmail,
            icon: 'tabler-circle',
            children: [
              {
                label: labels.verifyEmailV1,
                icon: 'tabler-circle',
                href: '/pages/auth/verify-email-v1',
                target: '_blank'
              },
              {
                label: labels.verifyEmailV2,
                icon: 'tabler-circle',
                href: '/pages/auth/verify-email-v2',
                target: '_blank'
              }
            ]
          },
          {
            label: labels.forgotPassword,
            icon: 'tabler-circle',
            children: [
              {
                label: labels.forgotPasswordV1,
                icon: 'tabler-circle',
                href: '/pages/auth/forgot-password-v1',
                target: '_blank'
              },
              {
                label: labels.forgotPasswordV2,
                icon: 'tabler-circle',
                href: '/pages/auth/forgot-password-v2',
                target: '_blank'
              }
            ]
          },
          {
            label: labels.resetPassword,
            icon: 'tabler-circle',
            children: [
              {
                label: labels.resetPasswordV1,
                icon: 'tabler-circle',
                href: '/pages/auth/reset-password-v1',
                target: '_blank'
              },
              {
                label: labels.resetPasswordV2,
                icon: 'tabler-circle',
                href: '/pages/auth/reset-password-v2',
                target: '_blank'
              }
            ]
          },
          {
            label: labels.twoSteps,
            icon: 'tabler-circle',
            children: [
              { label: labels.twoStepsV1, icon: 'tabler-circle', href: '/pages/auth/two-steps-v1', target: '_blank' },
              { label: labels.twoStepsV2, icon: 'tabler-circle', href: '/pages/auth/two-steps-v2', target: '_blank' }
            ]
          }
        ]
      },
      {
        label: labels.wizardExamples,
        icon: 'tabler-dots',
        children: [
          { label: labels.checkout, icon: 'tabler-circle', href: '/pages/wizard-examples/checkout' },
          {
            label: labels.propertyListing,
            icon: 'tabler-circle',
            href: '/pages/wizard-examples/property-listing'
          },
          { label: labels.createDeal, icon: 'tabler-circle', href: '/pages/wizard-examples/create-deal' }
        ]
      },
      { label: labels.dialogExamples, icon: 'tabler-square', href: '/pages/dialog-examples' },
      {
        label: labels.widgetExamples,
        icon: 'tabler-chart-bar',
        children: [
          { label: labels.basic, href: '/pages/widget-examples/basic' },
          { label: labels.advanced, icon: 'tabler-circle', href: '/pages/widget-examples/advanced' },
          { label: labels.statistics, icon: 'tabler-circle', href: '/pages/widget-examples/statistics' },
          { label: labels.charts, icon: 'tabler-circle', href: '/pages/widget-examples/charts' },
          { label: labels.actions, href: '/pages/widget-examples/actions' }
        ]
      }
    ]
  },
  {
    label: labels.formsAndTables,
    isSection: true,
    children: [
      { label: labels.formLayouts, icon: 'tabler-layout', href: '/forms/form-layouts' },
      { label: labels.formValidation, icon: 'tabler-checkup-list', href: '/forms/form-validation' },
      { label: labels.formWizard, icon: 'tabler-git-merge', href: '/forms/form-wizard' },
      { label: labels.reactTable, icon: 'tabler-table', href: '/react-table' },
      {
        label: labels.formELements,
        icon: 'tabler-checkbox',
        suffix: EXTERNAL_SUFFIX,
        href: `${DOCS_URL}/docs/user-interface/form-elements`,
        target: '_blank'
      },
      {
        label: labels.muiTables,
        icon: 'tabler-layout-board-split',
        href: `${DOCS_URL}/docs/user-interface/mui-table`,
        suffix: EXTERNAL_SUFFIX,
        target: '_blank'
      }
    ]
  },
  {
    label: labels.chartsMisc,
    isSection: true,
    children: [
      {
        label: labels.charts,
        icon: 'tabler-chart-donut-2',
        children: [
          { label: labels.apex, icon: 'tabler-circle', href: '/charts/apex-charts' },
          { label: labels.recharts, icon: 'tabler-circle', href: '/charts/recharts' }
        ]
      },
      {
        label: labels.foundation,
        icon: 'tabler-cards',
        href: `${DOCS_URL}/docs/user-interface/foundation`,
        suffix: EXTERNAL_SUFFIX,
        target: '_blank'
      },
      {
        label: labels.components,
        icon: 'tabler-atom',
        href: `${DOCS_URL}/docs/user-interface/components`,
        suffix: EXTERNAL_SUFFIX,
        target: '_blank'
      },
      {
        label: labels.menuExamples,
        icon: 'tabler-list-search',
        href: `${DOCS_URL}/docs/menu-examples/overview`,
        suffix: EXTERNAL_SUFFIX,
        target: '_blank'
      },
      {
        label: labels.raiseSupport,
        icon: 'tabler-lifebuoy',
        suffix: EXTERNAL_SUFFIX,
        target: '_blank',
        href: 'https://pixinvent.ticksy.com'
      },
      {
        label: labels.documentation,
        icon: 'tabler-book-2',
        suffix: EXTERNAL_SUFFIX,
        target: '_blank',
        href: DOCS_URL
      },
      {
        label: labels.others,
        icon: 'tabler-menu-2',
        children: [
          { suffix: { label: 'New', color: 'info' }, label: labels.itemWithBadge, icon: 'tabler-circle' },
          {
            label: labels.externalLink,
            icon: 'tabler-circle',
            href: 'https://pixinvent.com',
            target: '_blank',
            suffix: EXTERNAL_SUFFIX
          },
          {
            label: labels.menuLevels,
            icon: 'tabler-circle',
            children: [
              { label: labels.menuLevel2, icon: 'tabler-circle' },
              {
                label: labels.menuLevel2,
                icon: 'tabler-circle',
                children: [
                  { label: labels.menuLevel3, icon: 'tabler-circle' },
                  { label: labels.menuLevel3, icon: 'tabler-circle' }
                ]
              }
            ]
          },
          { label: labels.disabledMenu, disabled: true }
        ]
      }
    ]
  }
]
