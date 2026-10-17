import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import * as AuthContextModule from '../context/useAuth';
import * as RelayModule from '../lib/relay';
import type { Agent, ProvisionResponse } from '../types';

describe('Dashboard Page Provisioning & Onboarding Flow', () => {
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
    handle: 'bob42',
    address: 'bob42@agentmail',
    fingerprint: '1122 3344 5566 7788',
    custody_mode: 'server_kek',
    created_at: new Date().toISOString(),
    display_name: 'bob42',
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

  it('displays OnboardingCard when user has no agent and provisions chosen handle', async () => {
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
    });

    // Check onboarding card is shown with input and @agentmail suffix
    expect(screen.getByText('Create Your Agent ID')).toBeInTheDocument();
    expect(screen.getByTestId('agentmail-suffix')).toHaveTextContent('@agentmail');

    // Enter agent handle with spaces/characters to verify filtering: "bob 42!"
    const input = screen.getByPlaceholderText('myagent42');
    fireEvent.change(input, { target: { value: 'bob 42!' } });
    expect(screen.getByText('bob42@agentmail')).toBeInTheDocument();

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Complete Setup/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(provisionSpy).toHaveBeenCalledWith('valid-jwt-token', 'bob42');
    });

    // Agent card rendered after provisioning
    expect(screen.getByText('bob42@agentmail')).toBeInTheDocument();
    expect(screen.getByText('1122 3344 5566 7788')).toBeInTheDocument();
    expect(screen.getByText('Server Custody')).toBeInTheDocument();
  });

  it('renders existing agent directly without onboarding when agent already exists', async () => {
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
    expect(screen.getByText('bob42@agentmail')).toBeInTheDocument();
  });
});
