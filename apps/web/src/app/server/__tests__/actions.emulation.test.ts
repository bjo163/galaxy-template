// Integration tests per get*Data action — all emulation modes.
// static: returns bundled fake-db data.
// api: mocked fetch returns endpoint JSON.
// db: falls back to staticData until @galaxy/database entity+table exists (G-1).
// Executed with: tsx src/app/server/__tests__/actions.emulation.test.ts

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { db as ecommerceDb } from '@galaxy/fake-db/apps/ecommerce'

import { resolveDataSource, loadModuleData, fetchFromApi } from '@/app/server/data-source'

describe('data-source emulation: static | db | api', () => {
  it('resolveDataSource defaults to static', () => {
    assert.equal(resolveDataSource(), 'static')
    assert.equal(resolveDataSource(undefined), 'static')
    assert.equal(resolveDataSource('garbage'), 'static')
  })

  it('resolveDataSource accepts static/db/api', () => {
    assert.equal(resolveDataSource('static'), 'static')
    assert.equal(resolveDataSource('db'), 'db')
    assert.equal(resolveDataSource('api'), 'api')
  })

  it('loadModuleData static returns staticData unchanged', async () => {
    const result = await loadModuleData('static', { staticData: ecommerceDb })

    assert.equal(result, ecommerceDb)
    assert.ok(Array.isArray(result.products))
  })

  it('loadModuleData db falls back to staticData when no dbQuery', async () => {
    const result = await loadModuleData('db', { staticData: ecommerceDb })

    assert.equal(result, ecommerceDb)
    assert.ok(Array.isArray(result.products))
  })

  it('loadModuleData db uses dbQuery when supplied', async () => {
    const queryResult = { products: [{ id: 1, name: 'DB Product' }] }

    const result = await loadModuleData('db', {
      staticData: ecommerceDb as unknown as typeof queryResult,
      dbQuery: async () => queryResult,
    })

    assert.equal(result, queryResult)
    assert.equal(result.products[0].name, 'DB Product')
  })

  it('loadModuleData api requires endpointPath', async () => {
    let threw = false

    try {
      await loadModuleData('api', { staticData: ecommerceDb })
    } catch (e) {
      threw = true
      assert.equal((e as Error).message, '[data-source] endpointPath is required for api source')
    }

    assert.equal(threw, true)
  })

  it('fetchFromApi throws when API_URL not configured', async () => {
    const prev = process.env.API_URL

    delete process.env.API_URL
    let threw = false

    try {
      await fetchFromApi('/apps/ecommerce')
    } catch (e) {
      threw = true
      assert.equal((e as Error).message, '[data-source] API_URL is not configured; set API_URL or use DATA_SOURCE=static|db')
    }

    assert.equal(threw, true)
    if (prev !== undefined) process.env.API_URL = prev
    else delete process.env.API_URL
  })

  it('fetchFromApi returns JSON from mocked fetch', async () => {
    const prevUrl = process.env.API_URL
    const prevFetch = globalThis.fetch

    process.env.API_URL = 'http://test.api'

    const payload = { products: [{ id: 1, name: 'API Product' }] }

    globalThis.fetch = async (): Promise<Response> =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }) as unknown as Response

    try {
      const result = await loadModuleData('api', {
        staticData: ecommerceDb,
        endpointPath: '/apps/ecommerce',
      })

      assert.deepEqual(result, payload)
    } finally {
      globalThis.fetch = prevFetch
      if (prevUrl !== undefined) process.env.API_URL = prevUrl
      else delete process.env.API_URL
    }
  })

  it('fetchFromApi propagates non-ok status', async () => {
    const prevUrl = process.env.API_URL
    const prevFetch = globalThis.fetch

    process.env.API_URL = 'http://test.api'

    globalThis.fetch = async (): Promise<Response> =>
      new Response('Not found', { status: 404 }) as unknown as Response

    let threw = false

    try {
      await fetchFromApi('/apps/ecommerce')
    } catch (e) {
      threw = true
      assert.equal((e as Error).message, '[data-source] API /apps/ecommerce responded 404')
    }

    assert.equal(threw, true)

    globalThis.fetch = prevFetch
    if (prevUrl !== undefined) process.env.API_URL = prevUrl
    else delete process.env.API_URL
  })
})
