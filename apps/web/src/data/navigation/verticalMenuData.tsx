// Type Imports
import { verticalMenuData } from '@galaxy/fake-db/navigation/verticalMenu'

import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'
import type { MenuLabels } from '@/types/navigation/menuDataTypes'

// Data Imports

const verticalMenuDataAdapter = (dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] =>
  verticalMenuData(dictionary['navigation'] as unknown as MenuLabels) as unknown as VerticalMenuDataType[]

export default verticalMenuDataAdapter
