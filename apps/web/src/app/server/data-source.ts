// Data-source resolver for the static / db / api emulation toggle.
// Reads process.env.DATA_SOURCE (static | db | api); defaults to static.
// This keeps every get*Data() server action on a single replaceable seam so the
// backend can be swapped without touching any component or prop shape (FR-006).

export type DataSourceKind = 'static' | 'db' | 'api'

/** Resolve the active data source from the DATA_SOURCE env var. */
export function resolveDataSource(kind?: string): DataSourceKind {
  const raw = (kind ?? process.env.DATA_SOURCE ?? 'static') as DataSourceKind | undefined

  switch (raw) {
    case 'static':
    case 'db':
    case 'api':
      return raw
    default:
      return 'static'
  }
}

/** Fetch JSON from the upstream API. endpointPath like '/apps/ecommerce' or 'apps/ecommerce'. */
export async function fetchFromApi(endpointPath: string): Promise<unknown> {
  const base = process.env.API_URL

  if (!base) {
    throw new Error('[data-source] API_URL is not configured; set API_URL or use DATA_SOURCE=static|db')
  }

  const url = `${base.replace(/\/+$/, '')}/${endpointPath.replace(/^\/+/, '')}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    throw new Error(`[data-source] API ${endpointPath} responded ${res.status}`)
  }

  
return res.json()
}

/**
 * Load one module's dataset, choosing the backend by the active data source.
 * - static: return the bundled fake-db dataset
 * - api: fetch from API_URL + endpointPath
 *   db: run the injected dbQuery (repository.query().select()) — requires a bound
 *       entity model from @galaxy/database. Falls back to staticData when no
 *       query is supplied so the toggle stays safe until the DB slice is wired
 *       (gated on @galaxy/database entity + table for ecommerce products).
 */
export async function loadModuleData<T>(
  source: DataSourceKind,
  options: {
    staticData: T
    endpointPath?: string
    dbQuery?: () => Promise<T>
  },
): Promise<T> {
  switch (source) {
    case 'static':
      return options.staticData
    case 'api':
      if (!options.endpointPath) {
        throw new Error('[data-source] endpointPath is required for api source')
      }

      
return (await fetchFromApi(options.endpointPath)) as T
    case 'db':
      if (options.dbQuery) {
        return options.dbQuery()
      }

      
return options.staticData
  }
}
