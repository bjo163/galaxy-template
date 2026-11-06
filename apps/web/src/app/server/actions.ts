/**
 * ! The server actions below are used to fetch the static data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 */

'use server'

// Data Imports
import { db as eCommerceData } from '@galaxy/fake-db/apps/ecommerce'
import { db as ecommerceDashboardData } from '@galaxy/fake-db/apps/ecommerceDashboard'
import { db as academyData } from '@galaxy/fake-db/apps/academy'
import { db as vehicleData } from '@galaxy/fake-db/apps/logistics'
import { db as invoiceData } from '@galaxy/fake-db/apps/invoice'
import { db as userData } from '@galaxy/fake-db/apps/userList'
import { db as permissionData } from '@galaxy/fake-db/apps/permissions'
import { db as reactTableData } from '@galaxy/fake-db/apps/reactTable'
import { db as rolesData } from '@galaxy/fake-db/apps/roles'
import { db as dashboardData } from '@galaxy/fake-db/apps/dashboard'
import { db as userViewData } from '@galaxy/fake-db/apps/userView'
import { db as brandingData, dbShortcuts, dbNotifications } from '@galaxy/fake-db/pages/branding'
import { db as accountSettingsData } from '@galaxy/fake-db/pages/accountSettings'
import { db as frontPagesData } from '@galaxy/fake-db/pages/frontPages'
import { db as profileData } from '@galaxy/fake-db/pages/userProfile'
import { db as faqData } from '@galaxy/fake-db/pages/faq'
import { db as pricingData } from '@galaxy/fake-db/pages/pricing'
import { db as statisticsData } from '@galaxy/fake-db/pages/widgetExamples'
import { db as widgetExamplesAdvancedData } from '@galaxy/fake-db/pages/widgetExamplesAdvanced'
import { db as widgetExamplesChartsData } from '@galaxy/fake-db/pages/widgetExamplesCharts'
import { invoiceKPI } from '@galaxy/fake-db/apps/invoiceKPI'
import { invoicePreview } from '@galaxy/fake-db/apps/invoicePreview'
import { ecommerceOrderKPI } from '@galaxy/fake-db/apps/ecommerceOrderKPI'
import { userListCards } from '@galaxy/fake-db/apps/userListCards'

export const getEcommerceData = async () => {
  return eCommerceData
}

export const getInvoiceKPIData = async () => {
  return invoiceKPI
}

export const getInvoicePreviewData = async () => {
  return invoicePreview
}

export const getEcommerceOrderKPIData = async () => {
  return ecommerceOrderKPI
}

export const getUserListCardsData = async () => {
  return userListCards
}

export const getAcademyData = async () => {
  return academyData
}

export const getLogisticsData = async () => {
  return vehicleData
}

export const getInvoiceData = async () => {
  return invoiceData
}

export const getUserData = async () => {
  return userData
}

export const getPermissionsData = async () => {
  return permissionData
}

export const getProfileData = async () => {
  return profileData
}

export const getFaqData = async () => {
  return faqData
}

export const getPricingData = async () => {
  return pricingData
}

export const getStatisticsData = async () => {
  return statisticsData
}

export const getReactTableData = async () => {
  return reactTableData
}

export const getRolesData = async () => {
  return rolesData
}

export const getDashboardData = async () => {
  return dashboardData
}

export const getEcommerceDashboardData = async () => {
  return ecommerceDashboardData
}

export const getBrandingData = async () => {
  return brandingData
}

export const getHeaderShortcuts = async () => {
  return dbShortcuts
}

export const getHeaderNotifications = async () => {
  return dbNotifications
}

export const getUserViewData = async () => {
  return userViewData
}

export const getAccountSettingsData = async () => {
  return accountSettingsData
}

export const getFrontPagesData = async () => {
  return frontPagesData
}

export const getWidgetExamplesAdvancedData = async () => {
  return widgetExamplesAdvancedData
}

export const getWidgetExamplesChartsData = async () => {
  return widgetExamplesChartsData
}
