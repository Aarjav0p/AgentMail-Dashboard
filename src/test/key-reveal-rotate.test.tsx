import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentCard } from '../components/AgentCard';
import * as RelayModule from '../lib/relay';
import type { Agent } from '../types';

describe('AgentCard API Key Reveal & Rotate', () => {
  const sampleAgent: Agent = {
    id: 'agent-456',
    handle: 'charlie',
    address: 'charlie@agentmail',
    fingerprint: '9988 7766 5544 3322',
    custody_mode: 'server_kek',
    created_at: new Date().toISOString(),
    display_name: 'Charlie',
  };

  it('reveals key when clicking Reveal button and hides on second click', async () => {
    const revealSpy = vi.spyOn(RelayModule, 'revealAgentApiKey').mockResolvedValue('am_live_revealedSecretKey987654321');

    render(
      <AgentCard
        agent={sampleAgent}
        accessToken="mock-access-token"
      />
    );

    // Initial state: masked
    expect(screen.getByText(/am_live_••••/)).toBeInTheDocument();
    expect(screen.queryByText('am_live_revealedSecretKey987654321')).not.toBeInTheDocument();

    // Click Reveal
    const revealBtn = screen.getByRole('button', { name: /reveal/i });
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(revealSpy).toHaveBeenCalledWith('mock-access-token', 'agent-456');
    });

    // Unmasked key is now displayed
    expect(screen.getByText('am_live_revealedSecretKey987654321')).toBeInTheDocument();
    expect(screen.getByText(/Auto-hides in 60s/i)).toBeInTheDocument();

    // Click Hide
    const hideBtn = screen.getByRole('button', { name: /hide/i });
    fireEvent.click(hideBtn);

    // Masked again
    expect(screen.getByText(/am_live_••••/)).toBeInTheDocument();
  });

  it('rotates API key through confirmation modal', async () => {
    const rotateSpy = vi.spyOn(RelayModule, 'rotateAgentApiKey').mockResolvedValue('am_live_newlyRotatedKeyABCDEF12345');
    const onRotatedMock = vi.fn();

    render(
      <AgentCard
        agent={sampleAgent}
        accessToken="mock-access-token"
        onKeyRotated={onRotatedMock}
      />
    );

    // Click Rotate to open modal
    const rotateTriggerBtn = screen.getByRole('button', { name: /rotate/i });
    fireEvent.click(rotateTriggerBtn);

    // Check modal contents
    expect(screen.getByText('Rotate API Key?')).toBeInTheDocument();
    expect(screen.getByText(/stop working immediately/i)).toBeInTheDocument();

    // Click Confirm button inside modal
    const confirmBtn = screen.getByRole('button', { name: /rotate key/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(rotateSpy).toHaveBeenCalledWith('mock-access-token', 'agent-456');
    });

    // Check new key is shown and callback fired
    expect(screen.getByText('am_live_newlyRotatedKeyABCDEF12345')).toBeInTheDocument();
    expect(onRotatedMock).toHaveBeenCalledWith('am_live_newlyRotatedKeyABCDEF12345');
  });
});
