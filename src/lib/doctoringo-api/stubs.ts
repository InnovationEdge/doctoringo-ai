/**
 * Doctoringo AI — Stub APIs
 *
 * Payment, Documents, Countries — stubs until features are wired to backend.
 * Return types match component contracts so the UI compiles and renders
 * graceful empty/loading states.
 */
import { CountriesResponse } from './types';

export interface SubscriptionStatus {
  status: 'free' | 'pro' | 'premium';
  is_paid: boolean;
  is_active: boolean;
  auto_renew?: boolean;
  plan_name?: string;
  next_billing_date?: string;
  amount?: number;
  currency?: string;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  description?: string;
}

export interface PricingInfo {
  region: string;
  currency: string;
  currency_symbol: string;
  amount: number;
  formatted: string;
}

const DEFAULT_PRICING: Record<string, PricingInfo> = {
  GE: {
    region: 'GE',
    currency: 'GEL',
    currency_symbol: '₾',
    amount: 39,
    formatted: '₾39',
  },
  EU: {
    region: 'EU',
    currency: 'EUR',
    currency_symbol: '€',
    amount: 14.99,
    formatted: '€14.99',
  },
  US: {
    region: 'US',
    currency: 'USD',
    currency_symbol: '$',
    amount: 14.99,
    formatted: '$14.99',
  },
};

export const paymentApi = {
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => ({
    status: 'free',
    is_paid: false,
    is_active: true,
    auto_renew: false,
  }),

  getModelQuota: async (): Promise<{ remaining: number; total: number }> => ({
    remaining: 999,
    total: 999,
  }),

  getPricing: async (region: string = 'GE'): Promise<PricingInfo> => {
    return DEFAULT_PRICING[region] || DEFAULT_PRICING.GE;
  },

  getPaymentHistory: async (): Promise<PaymentHistoryItem[]> => [],

  cancelSubscription: async (): Promise<{ success: boolean }> => ({ success: true }),

  reactivateSubscription: async (): Promise<{ success: boolean }> => ({ success: true }),
};

export const contactApi = {
  submit: async (_data: {
    name?: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<{ success: boolean }> => {
    return { success: true };
  },
};

export interface DocumentRecord {
  id: string;
  document_id?: string;
  file_url: string;
  title: string;
  format: string;
  created_at?: string;
}

export const documentsApi = {
  listDocuments: async (): Promise<DocumentRecord[]> => [],
  getDocument: async (_id: string): Promise<DocumentRecord> => ({
    id: '',
    document_id: '',
    file_url: '',
    title: '',
    format: '',
  }),
  generateDocument: async (_params: Record<string, unknown>): Promise<DocumentRecord> => ({
    id: '',
    document_id: '',
    file_url: '',
    title: '',
    format: '',
  }),
  fillForm: async (_params: Record<string, unknown>): Promise<DocumentRecord> => ({
    id: '',
    document_id: '',
    file_url: '',
    title: '',
    format: '',
  }),
  deleteDocument: async (_id: string): Promise<null> => null,
  downloadDocument: async (_id: string, _title: string, _format: string): Promise<null> => null,
};

export const countriesApi = {
  getCountries: async (): Promise<CountriesResponse> => ({
    success: true,
    countries: [
      {
        code: 'GE',
        name: 'Georgia',
        native_name: 'საქართველო',
        flag_emoji: '🇬🇪',
        source_name: '',
        source_url: '',
        default_language: 'ka',
        document_count: 0,
        is_active: true,
      },
    ],
    default: 'GE',
  }),
};

export interface SearchResultItem {
  id: string;
  title: string;
  snippet?: string;
  url?: string;
  article?: string | null;
  article_title?: string;
  score?: number;
  document_type?: string;
  session_id?: string;
  type?: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  error?: string;
}

export const searchApi = {
  search: async (_query: string): Promise<SearchResponse> => ({ results: [] }),
  searchChats: async (_query: string): Promise<SearchResponse> => ({ results: [] }),
};

export const publicSearchApi = {
  search: async (_query: string): Promise<SearchResponse> => ({ results: [] }),
};

export function getCountryCode(jurisdiction?: string | null): string {
  return jurisdiction || 'GE';
}
