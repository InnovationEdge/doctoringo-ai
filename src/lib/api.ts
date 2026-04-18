/**
 * Doctoringo AI - API Integration Library
 * Backed by Supabase (Auth + Database + Edge Functions)
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
} from './supabase-api';

export type { Country, CountriesResponse } from './supabase-api';

export const API_BASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://pdokkwbhvfifqkcuzdzn.supabase.co';
