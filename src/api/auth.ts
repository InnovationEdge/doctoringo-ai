import { AuthUser } from 'src/providers/AuthProvider'
import { API_BASE_URL } from '../lib/api'

export const getAuthUser = async (): Promise<AuthUser> => {
  const response = await fetch(`${API_BASE_URL}/api/user/`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('User not authenticated')
  }

  return await response.json() as Promise<AuthUser>
}

export const logout = async (): Promise<void> => {
  // This is the correct way. We make the request and don't need to store the response.
  await fetch(`${API_BASE_URL}/accounts/logout/`, {
    credentials: 'include'
  })
}
