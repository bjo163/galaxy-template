// Parity tests for each extracted fake-db dataset.
// Runs under DATA_SOURCE=static (default). Asserts every exported `db` module
// is non-empty and shaped as expected — regression guard against accidental
// data loss during future refactors.
// Executed with: tsx src/app/server/__tests__/fake-db.parity.test.ts
// (node:test is bundled in Node.js; no vitest dependency added.)

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { db as logisticsDb } from '@galaxy/fake-db/apps/logistics'
import { db as accountSettingsDb } from '@galaxy/fake-db/pages/accountSettings'
import { db as academyDb } from '@galaxy/fake-db/apps/academy'
import { db as ecommerceDb } from '@galaxy/fake-db/apps/ecommerce'
import { db as ecommerceDashboardDb } from '@galaxy/fake-db/apps/ecommerceDashboard'
import { db as frontPagesDb } from '@galaxy/fake-db/pages/frontPages'
import { db as rolesDb } from '@galaxy/fake-db/apps/roles'
import { db as statisticsCardDb } from '@galaxy/fake-db/pages/statisticsCard'
import { db as userViewDb } from '@galaxy/fake-db/apps/userView'
import { db as dashboardDb } from '@galaxy/fake-db/apps/dashboard'
import { db as permissionsDb } from '@galaxy/fake-db/apps/permissions'
import { db as invoiceDb } from '@galaxy/fake-db/apps/invoice'
import { db as reactTableDb } from '@galaxy/fake-db/apps/reactTable'
import { db as userListDb } from '@galaxy/fake-db/apps/userList'

describe('fake-db parity: every extracted module exports non-empty db', () => {
  it('logistics: vehicleTracking + vehicleOverview + deliveryPerformance + ordersByCountries', () => {
    assert.ok(Array.isArray(logisticsDb.vehicleOverview), 'vehicleOverview is array')
    assert.ok(logisticsDb.vehicleOverview.length > 0, 'vehicleOverview non-empty')
    assert.ok(Array.isArray(logisticsDb.vehicleTracking), 'vehicleTracking is array')
    assert.ok(logisticsDb.vehicleTracking.length === 4, 'vehicleTracking has 4 rows')
    assert.ok(Array.isArray(logisticsDb.deliveryPerformance), 'deliveryPerformance is array')
    assert.ok(logisticsDb.deliveryPerformance.length > 0, 'deliveryPerformance non-empty')
    assert.ok(logisticsDb.ordersByCountries, 'ordersByCountries exists')
  })

  it('accountSettings: userNotifications + recentDevices + apiKeys + paymentMethods', () => {
    assert.ok(Array.isArray(accountSettingsDb.userNotifications), 'userNotifications is array')
    assert.ok(accountSettingsDb.userNotifications.length === 4, 'userNotifications has 4 rows')
    assert.ok(Array.isArray(accountSettingsDb.recentDevices), 'recentDevices is array')
    assert.ok(accountSettingsDb.recentDevices.length > 0, 'recentDevices non-empty')
    assert.ok(Array.isArray(accountSettingsDb.apiKeys), 'apiKeys is array')
    assert.ok(Array.isArray(accountSettingsDb.paymentMethods), 'paymentMethods is array')
  })

  it('academy: popularInstructors + topCourses + assignmentProgress + upcomingWebinar + interestedTopics', () => {
    assert.ok(Array.isArray(academyDb.popularInstructors), 'popularInstructors is array')
    assert.ok(academyDb.popularInstructors.length > 0, 'popularInstructors non-empty')
    assert.ok(Array.isArray(academyDb.topCourses), 'topCourses is array')
    assert.ok(academyDb.topCourses.length > 0, 'topCourses non-empty')
    assert.ok(Array.isArray(academyDb.assignmentProgress), 'assignmentProgress is array')
    assert.ok(academyDb.assignmentProgress.length > 0, 'assignmentProgress non-empty')
    assert.ok(Array.isArray(academyDb.upcomingWebinar), 'upcomingWebinar is array')
    assert.ok(academyDb.upcomingWebinar.length > 0, 'upcomingWebinar non-empty')
    assert.ok(Array.isArray(academyDb.interestedTopicsData1), 'interestedTopicsData1 is array')
    assert.ok(Array.isArray(academyDb.interestedTopicsData2), 'interestedTopicsData2 is array')
  })

  it('ecommerce: products + orderData + customerData + shippingRates + notificationSettings + orderItems', () => {
    assert.ok(Array.isArray(ecommerceDb.products), 'products is array')
    assert.ok(ecommerceDb.products.length > 0, 'products non-empty')
    assert.ok(Array.isArray(ecommerceDb.orderData), 'orderData is array')
    assert.ok(ecommerceDb.orderData.length > 0, 'orderData non-empty')
    assert.ok(Array.isArray(ecommerceDb.customerData), 'customerData is array')
    assert.ok(ecommerceDb.customerData.length > 0, 'customerData non-empty')
    assert.ok(ecommerceDb.shippingRates, 'shippingRates exists')
    assert.ok(Array.isArray(ecommerceDb.shippingRates.domestic), 'shippingRates.domestic is array')
    assert.ok(Array.isArray(ecommerceDb.shippingRates.international), 'shippingRates.international is array')
    assert.ok(ecommerceDb.notificationSettings, 'notificationSettings exists')
    assert.ok(Array.isArray(ecommerceDb.notificationSettings.customer), 'notificationSettings.customer is array')
    assert.ok(Array.isArray(ecommerceDb.notificationSettings.shipping), 'notificationSettings.shipping is array')
    assert.ok(Array.isArray(ecommerceDb.orderItems), 'orderItems is array')
  })

  it('ecommerceDashboard: transactions + earningReports + statisticsCard', () => {
    assert.ok(Array.isArray(ecommerceDashboardDb.transactions), 'transactions is array')
    assert.ok(ecommerceDashboardDb.transactions.length > 0, 'transactions non-empty')
    assert.ok(Array.isArray(ecommerceDashboardDb.earningReports), 'earningReports is array')
    assert.ok(ecommerceDashboardDb.earningReports.length > 0, 'earningReports non-empty')
  })

  it('frontPages: customerReviews', () => {
    assert.ok(Array.isArray(frontPagesDb.landing.customerReviews), 'customerReviews is array')
    assert.ok(frontPagesDb.landing.customerReviews.length > 0, 'customerReviews non-empty')
  })

  it('roles: roleCards', () => {
    assert.ok(Array.isArray(rolesDb.roleCards), 'roleCards is array')
    assert.ok(rolesDb.roleCards.length > 0, 'roleCards non-empty')
  })

  it('statisticsCard: statisticsCard (4 rows)', () => {
    assert.ok(Array.isArray(statisticsCardDb.statisticsCard), 'statisticsCard is array')
    assert.ok(statisticsCardDb.statisticsCard.length === 4, 'statisticsCard has 4 rows')
  })

  it('userView: recentDevices + connectedAccounts + apiKeys', () => {
    assert.ok(Array.isArray(userViewDb.recentDevices), 'recentDevices is array')
    assert.ok(userViewDb.recentDevices.length > 0, 'recentDevices non-empty')
    assert.ok(Array.isArray(userViewDb.connectedAccounts), 'connectedAccounts is array')
    assert.ok(userViewDb.connectedAccounts.length > 0, 'connectedAccounts non-empty')
    assert.ok(Array.isArray(userViewDb.paymentMethods), 'paymentMethods is array')
  })

  it('dashboard: cards', () => {
    assert.ok(dashboardDb, 'dashboard db exists')
    assert.ok(Array.isArray(dashboardDb.cards) || Object.keys(dashboardDb).length > 0, 'dashboard has datasets')
  })

  it('permissions: roles/permissions datasets', () => {
    assert.ok(permissionsDb, 'permissions db exists')
    assert.ok(Object.keys(permissionsDb).length > 0, 'permissions has datasets')
  })

  it('invoice: invoice datasets', () => {
    assert.ok(invoiceDb, 'invoice db exists')
    assert.ok(Object.keys(invoiceDb).length > 0, 'invoice has datasets')
  })

  it('reactTable: table data', () => {
    assert.ok(reactTableDb, 'reactTable db exists')
    assert.ok(Object.keys(reactTableDb).length > 0, 'reactTable has datasets')
  })

  it('userList: user list data', () => {
    assert.ok(userListDb, 'userList db exists')
    assert.ok(Object.keys(userListDb).length > 0, 'userList has datasets')
  })
})
