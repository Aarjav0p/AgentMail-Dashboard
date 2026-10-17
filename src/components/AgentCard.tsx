import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Key,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { Agent } from '../types';
import { revealAgentApiKey, rotateAgentApiKey, getFriendlyErrorMessage } from '../lib/relay';
import { ConnectSnippets } from './ConnectSnippets';
import { CustodyModal } from './CustodyModal';
import { RotateConfirmModal } from './RotateConfirmModal';

interface AgentCardProps {
  agent: Agent;
  initialApiKey?: string | null;
  accessToken: string;
  onKeyRotated?: (newKey: string) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  initialApiKey,
  accessToken,
  onKeyRotated,
}) => {
  const [apiKey, setApiKey] = useState<string | null>(initialApiKey || null);
  const [isRevealed, setIsRevealed] = useState<boolean>(Boolean(initialApiKey));
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState<boolean>(false);
  const [isCustodyModalOpen, setIsCustodyModalOpen] = useState<boolean>(false);
  const [revealCountdown, setRevealCountdown] = useState<number>(initialApiKey ? 60 : 0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auto-hide countdown timer (60s per PRD §7.1)
  useEffect(() => {
    if (!isRevealed || revealCountdown <= 0) return;

    const interval = setInterval(() => {
      setRevealCountdown((prev) => {
        if (prev <= 1) {
          setIsRevealed(false);
          setApiKey(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRevealed, revealCountdown]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleReveal = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      setApiKey(null);
      setRevealCountdown(0);
      return;
    }

    setActionError(null);
    setIsRevealing(true);
    try {
      const key = await revealAgentApiKey(accessToken, agent.id);
      setApiKey(key);
      setIsRevealed(true);
      setRevealCountdown(60);
    } catch (err: unknown) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setIsRevealing(false);
    }
  };

  const handleRotateConfirm = async () => {
    setActionError(null);
    setIsRotating(true);
    try {
      const newKey = await rotateAgentApiKey(accessToken, agent.id);
      setApiKey(newKey);
      setIsRevealed(true);
      setRevealCountdown(60);
      setIsRotateModalOpen(false);
      if (onKeyRotated) onKeyRotated(newKey);
    } catch (err: unknown) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setIsRotating(false);
    }
  };

  const maskedKey = apiKey
    ? isRevealed
      ? apiKey
      : `am_live_${'•'.repeat(32)}${apiKey.slice(-4)}`
    : `am_live_${'•'.repeat(36)}`;

  const formattedDate = agent.created_at
    ? new Date(agent.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="space-y-6">
      {/* Agent Identity Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-600/20 font-mono text-2xl font-bold">
              {agent.handle.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {agent.handle}
                </h2>
                <button
                  onClick={() => setIsCustodyModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
                  title="Click to view custody model details"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Server Custody</span>
                  <Info className="w-3 h-3 opacity-70" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {formattedDate}</span>
                </span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Mailbox
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-b border-zinc-800/80">
          {/* Agent Address */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                AgentMail Address
              </div>
              <div className="text-sm sm:text-base font-semibold text-zinc-100 font-mono">
                {agent.address}
              </div>
            </div>
            <button
              onClick={() => handleCopy(agent.address, 'address')}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Copy address"
            >
              {copiedField === 'address' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Fingerprint */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Public Key Fingerprint
              </div>
              <div className="text-xs sm:text-sm font-medium text-cyan-300 font-mono tracking-wider">
                {agent.fingerprint}
              </div>
            </div>
            <button
              onClick={() => handleCopy(agent.fingerprint, 'fingerprint')}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Copy fingerprint"
            >
              {copiedField === 'fingerprint' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* API Key Row */}
        <div className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Agent API Key</span>
              <span className="text-xs text-zinc-400">(Secret transport token for MCP calls)</span>
            </div>

            {isRevealed && revealCountdown > 0 && (
              <span className="text-xs text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md flex items-center gap-1.5 self-start sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Auto-hides in {revealCountdown}s
              </span>
            )}
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-mono text-xs sm:text-sm tracking-wide text-zinc-300 overflow-x-auto selection:bg-amber-500/20 py-1">
              {maskedKey}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {/* Reveal / Hide Button */}
              <button
                onClick={handleReveal}
                disabled={isRevealing}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors disabled:opacity-50"
                title={isRevealed ? 'Hide API key' : 'Reveal API key'}
              >
                {isRevealing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isRevealed ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reveal</span>
                  </>
                )}
              </button>

              {/* Copy Key Button */}
              {apiKey && isRevealed && (
                <button
                  onClick={() => handleCopy(apiKey, 'apiKey')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                  title="Copy full API key"
                >
                  {copiedField === 'apiKey' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}

              {/* Rotate Key Button */}
              <button
                onClick={() => setIsRotateModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
                title="Rotate API key"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>
            </div>
          </div>

          {actionError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {actionError}
            </div>
          )}
        </div>
      </div>

      {/* Pre-filled Connect Snippets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Connect Your AI Agent
            </h3>
            <p className="text-xs text-zinc-400">
              One-click instructions pre-filled with your agent's MCP endpoint and API key
            </p>
          </div>
        </div>

        <ConnectSnippets apiKey={isRevealed && apiKey ? apiKey : undefined} />
      </div>

      {/* Modals */}
      <CustodyModal
        isOpen={isCustodyModalOpen}
        onClose={() => setIsCustodyModalOpen(false)}
      />

      <RotateConfirmModal
        isOpen={isRotateModalOpen}
        onClose={() => setIsRotateModalOpen(false)}
        onConfirm={handleRotateConfirm}
        isRotating={isRotating}
      />
    </div>
  );
};
