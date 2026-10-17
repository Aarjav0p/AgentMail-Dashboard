import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import * as AuthContextModule from '../context/useAuth';
import * as RelayModule from '../lib/relay';
import type { Agent, ProvisionResponse } from '../types';

describe('Dashboard Page Provisioning Flow', () => {
  const mockUser = {
    id: 'user-uuid-1234',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'bob@example.com',
  };

  const sampleAgent: Agent = {
    id: 'agent-123',
    handle: 'bob',
    address: 'bob@agentmail',
    fingerprint: '1122 3344 5566 7788',
    custody_mode: 'server_kek',
    created_at: new Date().toISOString(),
    display_name: null,
  };

  beforeEach(() => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser as any,
      session: { access_token: 'valid-jwt-token' } as any,
      loading: false,
      isConfigured: true,
      isDemoMode: false,
      signInWithOtp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      getValidAccessToken: vi.fn().mockResolvedValue('valid-jwt-token'),
      enableDemoMode: vi.fn(),
      disableDemoMode: vi.fn(),
    });
  });

  it('automatically calls provisionAccountAgent when agent list is empty', async () => {
    const getAgentsSpy = vi.spyOn(RelayModule, 'getAccountAgents').mockResolvedValue([]);
    const provisionSpy = vi.spyOn(RelayModule, 'provisionAccountAgent').mockResolvedValue({
      agent: sampleAgent,
      api_key: 'am_live_newlyprovisionedkey1234567890abcdef',
      existing: false,
    } as ProvisionResponse);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(getAgentsSpy).toHaveBeenCalledWith('valid-jwt-token');
      expect(provisionSpy).toHaveBeenCalledWith('valid-jwt-token');
    });

    // Check rendered agent card
    expect(screen.getByText('bob@agentmail')).toBeInTheDocument();
    expect(screen.getByText('1122 3344 5566 7788')).toBeInTheDocument();
    expect(screen.getByText('Server Custody')).toBeInTheDocument();
  });

  it('renders existing agent without provisioning when agent already exists', async () => {
    const getAgentsSpy = vi.spyOn(RelayModule, 'getAccountAgents').mockResolvedValue([sampleAgent]);
    const provisionSpy = vi.spyOn(RelayModule, 'provisionAccountAgent');

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(getAgentsSpy).toHaveBeenCalledWith('valid-jwt-token');
    });

    expect(provisionSpy).not.toHaveBeenCalled();
    expect(screen.getByText('bob@agentmail')).toBeInTheDocument();
  });
});
