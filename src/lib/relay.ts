import {
  type Agent,
  type AgentsListResponse,
  type ApiKeyResponse,
  type HandleAvailabilityResponse,
  type ProvisionResponse,
  RelayApiError,
  type RelayApiErrorPayload,
} from '../types';

export const RELAY_API_URL = (
  import.meta.env.VITE_RELAY_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

export const MCP_URL =
  import.meta.env.VITE_MCP_URL || `${RELAY_API_URL}/mcp`;

/**
 * Maps relay API error codes to human-friendly messages
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof RelayApiError) {
    switch (error.code) {
      case 'HANDLE_TAKEN':
      case 'handle_taken':
        return 'That agent ID is already in use. Please try another.';
      case 'VALIDATION_ERROR':
      case 'validation_error':
        return error.message || 'Invalid agent ID format. Allowed characters: lowercase letters, numbers, and hyphens (3–32 chars).';
      case 'rate_limited':
      case 'RATE_LIMITED':
        return 'Rate limit reached. Please wait a short while before trying again.';
      case 'unauthorized':
      case 'UNAUTHORIZED':
        return 'Your session has expired or is invalid. Please sign in again.';
      case 'not_found':
      case 'NOT_FOUND':
        return 'Agent not found or access denied.';
      case 'handle_collision':
        return 'Unable to allocate a unique handle. Please try again in a few moments.';
      default:
        return error.message || 'An unexpected relay error occurred.';
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return `Unable to connect to the relay server at ${RELAY_API_URL}. Please ensure the relay is running.`;
    }
    return error.message;
  }

  return 'An unexpected error occurred.';
}

/**
 * Base fetch wrapper with Supabase JWT authorization header and standard error handling
 */
async function relayFetch<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${RELAY_API_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    throw new Error(
      err instanceof Error
        ? `Network error reaching relay: ${err.message}`
        : 'Network error reaching relay'
    );
  }

  if (!res.ok) {
    let errorCode = res.status === 401 ? 'UNAUTHORIZED' : `HTTP_${res.status}`;
    let errorMessage = `Request failed with status ${res.status}`;
    let details: unknown = undefined;

    try {
      const data = (await res.json()) as RelayApiErrorPayload;
      if (data && data.error) {
        errorCode = data.error.code || errorCode;
        errorMessage = data.error.message || errorMessage;
        details = data.error.details;
      }
    } catch {
      // Non-JSON error payload, fallback to status text
      errorMessage = res.statusText || errorMessage;
    }

    throw new RelayApiError(errorMessage, errorCode, res.status, details);
  }

  return (await res.json()) as T;
}

/**
 * GET /v1/account/agents
 * Lists all agents owned by the authenticated user
 */
export async function getAccountAgents(accessToken: string): Promise<Agent[]> {
  const data = await relayFetch<AgentsListResponse>('/v1/account/agents', accessToken, {
    method: 'GET',
  });
  return data.agents || [];
}

/**
 * GET /v1/account/handle-available?handle=…
 * Live handle availability check
 */
export async function checkHandleAvailability(
  accessToken: string,
  handle: string
): Promise<HandleAvailabilityResponse> {
  return await relayFetch<HandleAvailabilityResponse>(
    `/v1/account/handle-available?handle=${encodeURIComponent(handle)}`,
    accessToken,
    {
      method: 'GET',
    }
  );
}

/**
 * POST /v1/account/agents
 * Provisions an agent with the chosen handle for the authenticated user
 */
export async function provisionAccountAgent(
  accessToken: string,
  handle: string
): Promise<ProvisionResponse> {
  return await relayFetch<ProvisionResponse>('/v1/account/agents', accessToken, {
    method: 'POST',
    body: JSON.stringify({ handle }),
  });
}

/**
 * GET /v1/account/agents/{id}/api-key
 * Reveals the plaintext API key (audited, rate-limited)
 */
export async function revealAgentApiKey(accessToken: string, agentId: string): Promise<string> {
  const data = await relayFetch<ApiKeyResponse>(`/v1/account/agents/${encodeURIComponent(agentId)}/api-key`, accessToken, {
    method: 'GET',
  });
  return data.api_key;
}

/**
 * POST /v1/account/agents/{id}/api-key/rotate
 * Rotates the API key for the specified agent
 */
export async function rotateAgentApiKey(accessToken: string, agentId: string): Promise<string> {
  const data = await relayFetch<ApiKeyResponse>(`/v1/account/agents/${encodeURIComponent(agentId)}/api-key/rotate`, accessToken, {
    method: 'POST',
  });
  return data.api_key;
}
