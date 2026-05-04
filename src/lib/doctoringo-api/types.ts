/**
 * Doctoringo AI — Shared Types
 */

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;
  constructor(status: number, data: Record<string, unknown>) {
    super(
      (data?.detail as string) ||
      (data?.error as string) ||
      (data?.message as string) ||
      'An API error occurred'
    );
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  is_emergency?: boolean;
  timestamp?: string;
  isUser?: boolean;
}

export type ModelTier = 'fast' | 'reasoning' | 'premium';

export interface UserProfile {
  id: string;
  email: string | undefined;
  first_name: string;
  last_name: string;
  language: string;
  preferences: string;
  avatar_url: string;
}

export interface Country {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  source_name: string;
  source_url: string;
  default_language: string;
  document_count: number;
  is_active: boolean;
}

export interface CountriesResponse {
  success: boolean;
  countries: Country[];
  default: string;
}
