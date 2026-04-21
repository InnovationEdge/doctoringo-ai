/**
 * Doctoringo AI — backward compat re-exports
 */
export {
  ApiError,
  authApi,
  chatApi,
  paymentApi,
  contactApi,
  documentsApi,
  countriesApi,
  searchApi,
  publicSearchApi,
  getCountryCode,
} from './doctoringo-api/index';

export type { ChatSession, ChatMessage, ModelTier, UserProfile, Country, CountriesResponse } from './doctoringo-api/index';
