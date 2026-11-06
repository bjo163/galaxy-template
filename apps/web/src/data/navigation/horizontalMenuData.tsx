// Type Imports
import { horizontalMenuData } from '@galaxy/fake-db/navigation/horizontalMenu'

import type { HorizontalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'
import type { MenuLabels } from '@/types/navigation/menuDataTypes'

// Data Imports

const horizontalMenuDataAdapter = (
  dictionary: Awaited<ReturnType<typeof getDictionary>>
): HorizontalMenuDataType[] =>
  horizontalMenuData(dictionary['navigation'] as unknown as MenuLabels) as unknown as HorizontalMenuDataType[]

export default horizontalMenuDataAdapter
