import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import * as AuthContextModule from '../context/useAuth';
import * as RelayModule from '../lib/relay';
import type { Agent } from '../types';

describe('Dashboard Page Redirects & Agent View (PRD §7.1 & §10)', () => {
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

  it('/app redirects to /onboarding when the agent list is empty (PRD §10 test)', async () => {
    const getAgentsSpy = vi.spyOn(RelayModule, 'getAccountAgents').mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/onboarding" element={<div>Onboarding Route Mock</div>} />
          <Route path="/app" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getAgentsSpy).toHaveBeenCalledWith('valid-jwt-token');
      expect(screen.getByText('Onboarding Route Mock')).toBeInTheDocument();
    });
  });

  it('/app renders agent card directly when agent already exists', async () => {
    const getAgentsSpy = vi.spyOn(RelayModule, 'getAccountAgents').mockResolvedValue([sampleAgent]);

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/onboarding" element={<div>Onboarding Route Mock</div>} />
          <Route path="/app" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getAgentsSpy).toHaveBeenCalledWith('valid-jwt-token');
      expect(screen.getByText('bob42@agentmail')).toBeInTheDocument();
      expect(screen.getByText('1122 3344 5566 7788')).toBeInTheDocument();
    });

    expect(screen.queryByText('Onboarding Route Mock')).not.toBeInTheDocument();
  });
});
