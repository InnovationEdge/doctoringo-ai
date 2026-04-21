/**
 * Doctoringo AI — API barrel export
 */
export { ApiError } from './types';
export type { ChatSession, ChatMessage, ModelTier, UserProfile, Country, CountriesResponse } from './types';

export { authApi } from './auth';
export { chatApi } from './chat';
export { SYSTEM_PROMPT } from './prompts';

export {
  paymentApi,
  contactApi,
  documentsApi,
  countriesApi,
  searchApi,
  publicSearchApi,
  getCountryCode,
} from './stubs';
