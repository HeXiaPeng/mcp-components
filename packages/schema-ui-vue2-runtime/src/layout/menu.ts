export interface AppMenuItem {
  key: string
  label: string
  path?: string
  icon?: string
  children?: AppMenuItem[]
}

export const appMenuItems: AppMenuItem[] = []
