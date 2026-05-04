/**
 * Doctoringo AI - API Integration Library
 * Re-exports from modular doctoringo-api/ directory
 */
export {
  authApi,
  chatApi,
  paymentApi,
  contactApi,
  documentsApi,
  countriesApi,
  searchApi,
  publicSearchApi,
  getCountryCode,
  ApiError,
} from './doctoringo-api/index';

export type { Country, CountriesResponse } from './doctoringo-api/index';

export const API_BASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://pdokkwbhvfifqkcuzdzn.supabase.co';
