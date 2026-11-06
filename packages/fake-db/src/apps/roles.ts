// Type Imports
import type { RoleCard } from '@galaxy/types/apps/rolesTypes'

export const db = {
  roleCards: [
    { totalUsers: 4, title: 'Administrator', avatars: ['1.png', '2.png', '3.png', '4.png'] },
    { totalUsers: 7, title: 'Editor', avatars: ['5.png', '6.png', '7.png'] },
    { totalUsers: 5, title: 'Users', avatars: ['4.png', '5.png', '6.png'] },
    { totalUsers: 6, title: 'Support', avatars: ['1.png', '2.png', '3.png'] },
    { totalUsers: 10, title: 'Restricted User', avatars: ['4.png', '5.png', '6.png'] }
  ] satisfies RoleCard[]
}
