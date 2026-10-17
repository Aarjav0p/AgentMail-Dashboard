import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OnboardingPage } from '../pages/OnboardingPage';
import * as AuthContextModule from '../context/useAuth';
import * as RelayModule from '../lib/relay';
import type { Agent, ProvisionResponse } from '../types';

describe('Onboarding Page (PRD §7.1 & §10)', () => {
  const mockUser = {
    id: 'user-uuid-1234',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'user@example.com',
  };

  const sampleAgent: Agent = {
    id: 'agent-123',
    handle: 'alice',
    address: 'alice@agentmail',
    fingerprint: '1122 3344 5566 7788',
    custody_mode: 'server_kek',
    created_at: new Date().toISOString(),
    display_name: 'alice',
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

  it('redirects to /app if user already has an agent', async () => {
    vi.spyOn(RelayModule, 'getAccountAgents').mockResolvedValue([sampleAgent]);

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/app" element={<div>Dashboard Page Mock</div>} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page Mock')).toBeInTheDocument();
    });
  });

  it('renders split input group with fixed @agentmail suffix and filters input', async () => {
    vi.spyOn(RelayModule, 'getAccountAgents').mockResolvedValue([]);
    vi.spyOn(RelayModule, 'checkHandleAvailability').mockResolvedValue({
      handle: 'mybot-1',
      available: true,
    });

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/app" element={<div>Dashboard Page Mock</div>} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Choose your agent ID')).toBeInTheDocument();
    });

    expect(screen.getByTestId('agentmail-suffix')).toHaveTextContent('@agentmail');

    // Test input filtering: type uppercase, spaces, @ symbol: "My Bot-1 @!"
    const input = screen.getByPlaceholderText('alice') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Bot-1 @!' } });

    // Should auto-lowercase and reject characters outside [a-z0-9-]
    expect(input.value).toBe('mybot-1');
    expect(screen.getByText('mybot-1@agentmail')).toBeInTheDocument();
  });

  it('checks availability after typing debounce and enables submit on green', async () => {
    vi.spyOn(RelayModule, 'getAccountAgents').mockResolvedValue([]);
    const availSpy = vi.spyOn(RelayModule, 'checkHandleAvailability').mockResolvedValue({
      handle: 'superagent',
      available: true,
    });
    const provisionSpy = vi.spyOn(RelayModule, 'provisionAccountAgent').mockResolvedValue({
      agent: { ...sampleAgent, handle: 'superagent', address: 'superagent@agentmail' },
      api_key: 'am_live_key123',
      existing: false,
    } as ProvisionResponse);

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/app" element={<div>Dashboard Page Mock</div>} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Choose your agent ID')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('alice');
    fireEvent.change(input, { target: { value: 'superagent' } });

    // Wait for 400ms debounce and availability response
    await waitFor(() => {
      expect(availSpy).toHaveBeenCalledWith('valid-jwt-token', 'superagent');
      expect(screen.getByText('Available')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Complete Setup/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(provisionSpy).toHaveBeenCalledWith('valid-jwt-token', 'superagent');
      expect(screen.getByText('Dashboard Page Mock')).toBeInTheDocument();
    });
  });

  it('shows error indicator when handle is taken and disables submit', async () => {
    vi.spyOn(RelayModule, 'getAccountAgents').mockResolvedValue([]);
    vi.spyOn(RelayModule, 'checkHandleAvailability').mockResolvedValue({
      handle: 'takenhandle',
      available: false,
      reason: 'taken',
    });

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/app" element={<div>Dashboard Page Mock</div>} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Choose your agent ID')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('alice');
    fireEvent.change(input, { target: { value: 'takenhandle' } });

    await waitFor(() => {
      expect(screen.getByText('Taken — try another')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Complete Setup/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows error indicator when handle is reserved', async () => {
    vi.spyOn(RelayModule, 'getAccountAgents').mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/app" element={<div>Dashboard Page Mock</div>} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Choose your agent ID')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('alice');
    fireEvent.change(input, { target: { value: 'postmaster' } });

    await waitFor(() => {
      expect(screen.getByText('Reserved handle — choose another')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Complete Setup/i });
    expect(submitBtn).toBeDisabled();
  });
});
