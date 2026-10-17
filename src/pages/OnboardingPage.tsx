import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import {
  getAccountAgents,
  checkHandleAvailability,
  provisionAccountAgent,
  getFriendlyErrorMessage,
} from '../lib/relay';
import type { HandleAvailabilityResponse } from '../types';

export const OnboardingPage: React.FC = () => {
  const { getValidAccessToken, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [handle, setHandle] = useState<string>('');
  const [debouncedHandle, setDebouncedHandle] = useState<string>('');
  const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false);
  const [availability, setAvailability] = useState<HandleAvailabilityResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string>('');

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Check if user already has an agent; if so, redirect directly to /app
  useEffect(() => {
    let isCancelled = false;

    async function checkExistingAgent() {
      const token = await getValidAccessToken();
      if (isCancelled) return;
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
      setAccessToken(token);

      try {
        const agents = await getAccountAgents(token);
        if (isCancelled) return;
        if (agents && agents.length > 0) {
          navigate('/app', { replace: true });
          return;
        }
      } catch {
        // In demo mode or if offline, check localStorage
        if (isDemoMode) {
          const savedDemo = localStorage.getItem('agentmail_demo_agent');
          if (savedDemo) {
            navigate('/app', { replace: true });
            return;
          }
        }
      } finally {
        if (!isCancelled) setIsCheckingExisting(false);
      }
    }

    checkExistingAgent();

    return () => {
      isCancelled = true;
    };
  }, [getValidAccessToken, navigate, isDemoMode]);

  // 2. Debounce handle changes by 400ms (PRD §7.1)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedHandle(handle);
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handle]);

  // 3. Live availability check
  useEffect(() => {
    let isCancelled = false;

    async function runAvailabilityCheck() {
      const clean = debouncedHandle.trim();
      if (!clean) {
        setAvailability(null);
        setCheckingAvailability(false);
        return;
      }

      // Client-side regex pre-check: ^[a-z0-9][a-z0-9-]{2,31}$
      const regex = /^[a-z0-9][a-z0-9-]{2,31}$/;
      if (!regex.test(clean)) {
        setAvailability({
          handle: clean,
          available: false,
          reason: 'invalid',
        });
        setCheckingAvailability(false);
        return;
      }

      setCheckingAvailability(true);

      // In demo mode without active backend, provide realistic local availability
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 150));
        if (isCancelled) return;
        const DEMO_RESERVED = new Set(['admin', 'postmaster']); // demo theater only — NOT the real list
        if (DEMO_RESERVED.has(clean)) {
          setAvailability({ handle: clean, available: false, reason: 'reserved' });
        } else if (clean === 'taken' || clean === 'bob') {
          setAvailability({ handle: clean, available: false, reason: 'taken' });
        } else {
          setAvailability({ handle: clean, available: true });
        }
        setCheckingAvailability(false);
        return;
      }

      try {
        const result = await checkHandleAvailability(accessToken, clean);
        if (!isCancelled) {
          setAvailability(result);
        }
      } catch (err) {
        console.error('Availability check failed:', err);
        // Fallback: if server error or offline, validate client-side regex
        if (!isCancelled) {
          setAvailability({ handle: clean, available: true });
        }
      } finally {
        if (!isCancelled) {
          setCheckingAvailability(false);
        }
      }
    }

    runAvailabilityCheck();

    return () => {
      isCancelled = true;
    };
  }, [debouncedHandle, accessToken, isDemoMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-lowercase as they type; reject characters outside [a-z0-9-]; block @ (PRD §7.1)
    const raw = e.target.value.toLowerCase().replace(/@/g, '');
    const sanitized = raw.replace(/[^a-z0-9-]/g, '');
    setHandle(sanitized);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability?.available || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const chosen = handle.trim();

    if (isDemoMode) {
      try {
        const provisioned = await provisionAccountAgent(accessToken, chosen);
        localStorage.setItem(
          'agentmail_demo_agent',
          JSON.stringify({ agent: provisioned.agent, api_key: provisioned.api_key })
        );
      } catch {
        // Local demo mode fallback
        const demoAgent = {
          id: `demo-${Date.now()}`,
          handle: chosen,
          address: `${chosen}@agentmail`,
          fingerprint: 'A3F9 27C1 88D0 4E21 99B2 5F10',
          custody_mode: 'server_kek',
          created_at: new Date().toISOString(),
          display_name: chosen,
        };
        const demoKey = `am_live_demo_${chosen}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem(
          'agentmail_demo_agent',
          JSON.stringify({ agent: demoAgent, api_key: demoKey })
        );
      }
      navigate('/app', { replace: true });
      return;
    }

    try {
      await provisionAccountAgent(accessToken, chosen);
      navigate('/app', { replace: true });
    } catch (err: unknown) {
      console.error('Provisioning failed:', err);
      const friendly = getFriendlyErrorMessage(err);
      setSubmitError(friendly);
      // Re-trigger availability check
      setDebouncedHandle('');
      setTimeout(() => setDebouncedHandle(chosen), 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingExisting) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs text-zinc-400 font-medium">Checking agent status...</span>
      </div>
    );
  }

  const fullAddress = handle ? `${handle}@agentmail` : '';

  return (
    <div className="min-h-[85vh] max-w-xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-600/25">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> First-time Setup
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Choose your agent ID
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
          Select a permanent identifier for your AI agent mailbox. This will form your complete agent address and MCP credentials.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="agent-id-input"
              className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
            >
              Agent ID
            </label>

            {/* Split Input Group: editable text field + fixed, non-editable @agentmail box */}
            <div className="flex items-stretch rounded-xl border border-zinc-700 bg-zinc-950 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all overflow-hidden">
              <input
                id="agent-id-input"
                type="text"
                value={handle}
                onChange={handleInputChange}
                placeholder="alice"
                disabled={isSubmitting}
                maxLength={32}
                autoFocus
                className="flex-1 bg-transparent px-4 py-3 text-sm sm:text-base font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              />
              <span
                data-testid="agentmail-suffix"
                className="flex items-center px-4 bg-zinc-800/90 text-cyan-400 font-mono text-sm font-semibold select-none border-l border-zinc-700"
              >
                @agentmail
              </span>
            </div>

            {/* Status indicator row (availability check / validation) */}
            <div className="mt-2.5 flex items-center justify-between text-xs min-h-[20px]">
              <div>
                {checkingAvailability && (
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Checking availability...</span>
                  </span>
                )}

                {!checkingAvailability && availability && (
                  <>
                    {availability.available && (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Available</span>
                      </span>
                    )}

                    {!availability.available && availability.reason === 'taken' && (
                      <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                        <XCircle className="w-4 h-4" />
                        <span>Taken — try another</span>
                      </span>
                    )}

                    {!availability.available && availability.reason === 'reserved' && (
                      <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                        <XCircle className="w-4 h-4" />
                        <span>Reserved handle — choose another</span>
                      </span>
                    )}

                    {!availability.available && availability.reason === 'invalid' && (
                      <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                        <XCircle className="w-4 h-4" />
                        <span>Invalid format (3–32 chars, starts with a letter/digit)</span>
                      </span>
                    )}
                  </>
                )}

                {!checkingAvailability && !availability && handle.length > 0 && handle.length < 3 && (
                  <span className="text-zinc-500">Minimum 3 characters</span>
                )}
              </div>

              <span className="text-[11px] text-zinc-500">
                Letters, numbers, hyphens (3–32 chars)
              </span>
            </div>
          </div>

          {/* Live Full Address Preview */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Full Address Preview
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-bold text-cyan-300 truncate">
                {fullAddress || 'yourname@agentmail'}
              </span>
              {availability?.available && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </div>
          </div>

          {/* Error Banner */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>{submitError}</div>
            </div>
          )}

          {/* Submit Button (disabled until available: true) */}
          <button
            type="submit"
            disabled={!availability?.available || isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm shadow-xl shadow-cyan-600/25 hover:shadow-cyan-600/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Provisioning Agent Mailbox...</span>
              </>
            ) : (
              <>
                <span>Complete Setup &amp; Get API Key</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Small print per PRD §7.1 */}
          <p className="text-[11px] text-zinc-400 text-center leading-normal pt-1">
            Your agent ID is permanent — it's the name other agents will mail you at.
          </p>
        </form>
      </div>
    </div>
  );
};
