import { LanguageType } from 'core/types'

interface AuthUserParams {
  token: string
  client_id: string
  grant_type: string
}

export const transformGoogleAuthUserParams = (googleToken: string): AuthUserParams => {
  return {
    token: googleToken,
    client_id: process.env.API_AUTH_CLIENT_ID as string,
    grant_type: process.env.GOOGLE_AUTH_GRANT_TYPE as string
  }
}

export const languageItems = [
  { key: LanguageType.ENG, label: 'English (US)' },
  { key: LanguageType.GEO, label: 'ქართული' }
]
