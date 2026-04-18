import { useReducer, Dispatch } from 'react'
import { AuthUser } from 'src/providers/AuthProvider' // We'll import from AuthProvider

// --- Simplified State Shape ---
export interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
}

// --- Simplified Actions ---
type AuthAction =
    | { type: 'AUTH_REQUEST_START' }
    | { type: 'AUTH_REQUEST_SUCCESS', payload: AuthUser }
    | { type: 'AUTH_REQUEST_FAILURE' }
    | { type: 'LOGOUT_SUCCESS' };

// --- Initial State ---
// Start in a loading state to check for an existing session on app load.
export const initialAuthState: AuthStore = {
  user: null,
  isLoading: true,
  error: null
}

// --- The Reducer ---
export const authReducer = (state: AuthStore, action: AuthAction): AuthStore => {
  switch (action.type) {
  case 'AUTH_REQUEST_START':
    return {
      ...state,
      isLoading: true,
      user: null,
      error: null
    }
  case 'AUTH_REQUEST_SUCCESS':
    return {
      ...state,
      isLoading: false,
      user: action.payload,
      error: null
    }
  case 'AUTH_REQUEST_FAILURE':
    return {
      ...state,
      isLoading: false,
      user: null
    }
  case 'LOGOUT_SUCCESS':
    return {
      ...initialAuthState,
      isLoading: false // We're done loading, there's just no user
    }
  default:
    return state
  }
}

export const useAuthReducer = (): [AuthStore, Dispatch<AuthAction>] => {
  return useReducer(authReducer, initialAuthState)
}
