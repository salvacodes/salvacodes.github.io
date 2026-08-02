export const APP_ACTIVATE_EVENT = 'app-activate'

export interface AppActivateDetail {
  appId: string
  params?: Record<string, string>
  title?: string
}
