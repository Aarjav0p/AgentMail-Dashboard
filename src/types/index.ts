export type CustodyMode = 'user_passphrase' | 'server_kek';

export interface Agent {
  id: string;
  handle: string;
  address: string;
  fingerprint: string;
  custody_mode: CustodyMode;
  created_at: string;
  display_name?: string | null;
}

export interface ProvisionResponse {
  agent: Agent;
  api_key: string;
  existing: boolean;
}

export interface AgentsListResponse {
  agents: Agent[];
}

export interface ApiKeyResponse {
  api_key: string;
}

export interface HandleAvailabilityResponse {
  handle: string;
  available: boolean;
  reason?: 'taken' | 'reserved' | 'invalid';
}

export interface UserContact {
  id: string;
  alias: string;
  target_handle: string;
  address: string;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactsListResponse {
  contacts: UserContact[];
}

export interface ContactResponse {
  contact: UserContact;
}

export interface CreateContactPayload {
  alias: string;
  target_handle: string;
  note?: string | null;
}

export interface UpdateContactPayload {
  alias?: string;
  target_handle?: string;
  note?: string | null;
}

export interface RelayApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class RelayApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'RelayApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
