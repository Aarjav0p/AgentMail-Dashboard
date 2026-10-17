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
