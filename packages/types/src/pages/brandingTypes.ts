// Type Imports
import type { ThemeColor, CustomAvatarProps } from '../base'

export type SocialLink = {
  icon: string
  url: string
}

export type FooterLink = {
  label: string
  url: string
}

export type AppStoreLink = {
  iconImg: string
  iconAlt: string
  overline: string
  title: string
}

export type FooterColumn = {
  title: string
  links: Array<{ label: string; url: string; isNew?: boolean }>
}

export type BrandingData = {
  templateName: string
  company: { name: string; url: string }
  copyright: { prefix: string; heart: string; separator: string }
  footerLinks: FooterLink[]
  socialLinks: SocialLink[]
  marketing: {
    description: string
    newsletter: { label: string; placeholder: string; button: string }
    appStoreLinks: AppStoreLink[]
    pagesColumn: FooterColumn
    productsColumn: FooterColumn
  }
}

export type ShortcutsData = {
  url: string
  icon: string
  title: string
  subtitle: string
}

export type HeaderNotification = {
  title: string
  subtitle: string
  time: string
  read: boolean
  avatarImage?: string
  avatarIcon?: string
  avatarText?: string
  avatarColor?: ThemeColor
  avatarSkin?: CustomAvatarProps['skin']
}

export type FrontMenuItem = {
  label: string
  href: string
  highlightKey?: string
}

export type DropdownGroup = {
  title: string
  icon: string
  hrefPrefix: string
  target?: '_blank'
  items: Array<{ title: string; href: string }>
}
