import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import * as AuthContextModule from '../context/useAuth';
import { MCP_URL } from '../lib/relay';

describe('Landing Page', () => {
  it('renders hero, MCP URL, setup tabs, and CTAs', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: false,
      isConfigured: true,
      isDemoMode: false,
      signInWithOtp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      getValidAccessToken: vi.fn(),
      enableDemoMode: vi.fn(),
      disableDemoMode: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Hero title & value proposition
    expect(screen.getByText(/Email for/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Agents/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Any agent can mail any other agent/i)
    ).toBeInTheDocument();

    // MCP URL block
    expect(screen.getByText(MCP_URL)).toBeInTheDocument();

    // Setup tabs
    expect(screen.getByRole('button', { name: /Claude Code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cursor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Any MCP Client/i })).toBeInTheDocument();

    // CTA link
    const cta = screen.getByRole('link', { name: /Sign in to get your API key/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/login');

    // Advanced passphrase registration links are removed
    expect(screen.queryByText(/register with your own passphrase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Legacy Register/i)).not.toBeInTheDocument();
  });

  it('switches between setup instruction tabs', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: false,
      isConfigured: true,
      isDemoMode: false,
      signInWithOtp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      getValidAccessToken: vi.fn(),
      enableDemoMode: vi.fn(),
      disableDemoMode: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Default tab is Claude Code
    expect(screen.getByText(/claude mcp add/i)).toBeInTheDocument();

    // Switch to Cursor
    const cursorTab = screen.getByRole('button', { name: /Cursor/i });
    fireEvent.click(cursorTab);
    expect(screen.getByText(/"mcpServers":/i)).toBeInTheDocument();

    // Switch to Generic
    const genericTab = screen.getByRole('button', { name: /Any MCP Client/i });
    fireEvent.click(genericTab);
    expect(screen.getByText(/# Remote MCP Endpoint/i)).toBeInTheDocument();
  });

  it('renders "Go to Dashboard" CTA when user is logged in', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      },
      session: null,
      loading: false,
      isConfigured: true,
      isDemoMode: false,
      signInWithOtp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      getValidAccessToken: vi.fn(),
      enableDemoMode: vi.fn(),
      disableDemoMode: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Hero CTA links to /app instead of /login
    const heroDashboardLink = screen.getByRole('link', { name: /Go to Dashboard/i });
    expect(heroDashboardLink).toBeInTheDocument();
    expect(heroDashboardLink).toHaveAttribute('href', '/app');

    // Bottom CTA links to /app
    const bottomDashboardLink = screen.getByRole('link', {
      name: /View your API key and manage agents in your dashboard/i,
    });
    expect(bottomDashboardLink).toBeInTheDocument();
    expect(bottomDashboardLink).toHaveAttribute('href', '/app');

    // Sign in CTA should not be present
    expect(
      screen.queryByRole('link', { name: /Sign in to get your API key/i })
    ).not.toBeInTheDocument();
  });
});
