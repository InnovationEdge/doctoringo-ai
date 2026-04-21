/**
 * Doctoringo AI — Stub APIs
 *
 * Payment, Documents, Countries — stubs until features are needed.
 */
import { CountriesResponse } from './types';

export const paymentApi = {
  getSubscriptionStatus: async () => ({
    status: 'free' as const,
    is_paid: false,
    is_active: true,
  }),

  getModelQuota: async () => ({
    remaining: 999,
    total: 999,
  }),
};

export const contactApi = {
  submit: async (_data: { name?: string; email: string; subject?: string; message: string }) => {
    return { success: true };
  },
};

export const documentsApi = {
  listDocuments: async () => [] as Record<string, unknown>[],
  getDocument: async (_id: string) => ({ id: '', file_url: '', title: '', format: '' }),
  generateDocument: async (_params: Record<string, unknown>) => ({ id: '', file_url: '', title: '', format: '' }),
  fillForm: async (_params: Record<string, unknown>) => ({ id: '', file_url: '', title: '', format: '' }),
  deleteDocument: async (_id: string) => null,
  downloadDocument: async (_id: string, _title: string, _format: string) => null,
};

export const countriesApi = {
  getCountries: async (): Promise<CountriesResponse> => ({
    success: true,
    countries: [{
      code: 'GE',
      name: 'Georgia',
      native_name: 'საქართველო',
      flag_emoji: '🇬🇪',
      source_name: '',
      source_url: '',
      default_language: 'ka',
      document_count: 0,
      is_active: true,
    }],
    default: 'GE',
  }),
};

export const searchApi = {
  search: async (_query: string) => ({ results: [] }),
};

export const publicSearchApi = {
  search: async (_query: string) => ({ results: [] }),
};

export function getCountryCode(jurisdiction?: string | null): string {
  return jurisdiction || 'GE';
}
