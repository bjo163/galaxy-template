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
import { db as profileData } from '@galaxy/fake-db/pages/userProfile'
import { db as faqData } from '@galaxy/fake-db/pages/faq'
import { db as pricingData } from '@galaxy/fake-db/pages/pricing'
import { db as statisticsData } from '@galaxy/fake-db/pages/widgetExamples'
import { db as widgetExamplesAdvancedData } from '@galaxy/fake-db/pages/widgetExamplesAdvanced'

export const getEcommerceData = async () => {
  return eCommerceData
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

export const getWidgetExamplesAdvancedData = async () => {
  return widgetExamplesAdvancedData
}
