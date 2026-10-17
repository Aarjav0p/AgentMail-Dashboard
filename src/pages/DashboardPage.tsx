import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw, Sparkles, Mail } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import type { Agent } from '../types';
import {
  getAccountAgents,
  provisionAccountAgent,
  getFriendlyErrorMessage,
  RELAY_API_URL,
} from '../lib/relay';
import { AgentCard } from '../components/AgentCard';
import { OnboardingCard } from '../components/OnboardingCard';

export const DashboardPage: React.FC = () => {
  const { user, getValidAccessToken, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [initialApiKey, setInitialApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  const handleRetry = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      const token = await getValidAccessToken();
      if (isCancelled) return;

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
      setAccessToken(token);

      // Demo mode handling
      if (isDemoMode) {
        try {
          const agents = await getAccountAgents(token);
          if (isCancelled) return;
          if (agents && agents.length > 0) {
            setAgent(agents[0]);
          } else {
            // Check if demo agent exists in localStorage
            const savedDemo = localStorage.getItem('agentmail_demo_agent');
            if (savedDemo) {
              try {
                const parsed = JSON.parse(savedDemo);
                setAgent(parsed.agent);
                setInitialApiKey(parsed.api_key);
              } catch {
                setAgent(null);
              }
            } else {
              // Show onboarding to choose custom agent ID
              setAgent(null);
            }
          }
        } catch {
          if (!isCancelled) {
            const savedDemo = localStorage.getItem('agentmail_demo_agent');
            if (savedDemo) {
              try {
                const parsed = JSON.parse(savedDemo);
                setAgent(parsed.agent);
                setInitialApiKey(parsed.api_key);
              } catch {
                setAgent(null);
              }
            } else {
              setAgent(null);
            }
          }
        } finally {
          if (!isCancelled) setLoading(false);
        }
        return;
      }

      // Live Supabase + Relay handling
      try {
        const agents = await getAccountAgents(token);
        if (isCancelled) return;

        if (agents && agents.length > 0) {
          setAgent(agents[0]);
        } else {
          // If no agent yet, user will be prompted with OnboardingCard to choose their Agent ID
          setAgent(null);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error('Failed to load agents:', err);
          setError(getFriendlyErrorMessage(err));
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [getValidAccessToken, navigate, isDemoMode, retryTrigger]);

  const handleOnboardingSubmit = async (chosenHandle: string) => {
    setIsSubmittingOnboarding(true);
    setOnboardingError(null);

    if (isDemoMode) {
      try {
        const provisioned = await provisionAccountAgent(accessToken, chosenHandle);
        setAgent(provisioned.agent);
        setInitialApiKey(provisioned.api_key);
        localStorage.setItem(
          'agentmail_demo_agent',
          JSON.stringify({ agent: provisioned.agent, api_key: provisioned.api_key })
        );
      } catch {
        // Fallback demo provisioning
        const demoAgent: Agent = {
          id: `demo-${Date.now()}`,
          handle: chosenHandle,
          address: `${chosenHandle}@agentmail`,
          fingerprint: 'A3F9 27C1 88D0 4E21 99B2 5F10',
          custody_mode: 'server_kek',
          created_at: new Date().toISOString(),
          display_name: chosenHandle,
        };
        const demoKey = `am_live_demo_${chosenHandle}_${Math.random().toString(36).substring(2, 10)}`;
        setAgent(demoAgent);
        setInitialApiKey(demoKey);
        localStorage.setItem(
          'agentmail_demo_agent',
          JSON.stringify({ agent: demoAgent, api_key: demoKey })
        );
      } finally {
        setIsSubmittingOnboarding(false);
      }
      return;
    }

    try {
      const provisioned = await provisionAccountAgent(accessToken, chosenHandle);
      setAgent(provisioned.agent);
      setInitialApiKey(provisioned.api_key);
    } catch (err: unknown) {
      setOnboardingError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  return (
    <div className="min-h-[85vh] max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Agent Mailbox Dashboard
            </h1>
            {isDemoMode && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Demo Preview
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your AI agent identity, cryptographic custody, and MCP credentials
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl self-start sm:self-auto font-mono">
            <Mail className="w-3.5 h-3.5 text-zinc-400" />
            <span className="max-w-[200px] truncate">{user.email}</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="text-sm font-semibold text-zinc-200">
            Checking agent mailbox...
          </div>
          <p className="text-xs text-zinc-400 max-w-sm">
            Fetching your agent credentials...
          </p>
        </div>
      )}

      {/* Relay Error state */}
      {!loading && error && (
        <div className="bg-zinc-900 border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Relay Connection Error</h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                We couldn't connect to the relay service to load your agent.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-rose-300 break-all mb-6">
            {error}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
            <span className="text-xs text-zinc-400">
              Relay endpoint: <code className="text-cyan-400">{RELAY_API_URL}</code>
            </span>
            <button
              onClick={handleRetry}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Onboarding View (when user has no agent yet) */}
      {!loading && !error && !agent && (
        <OnboardingCard
          onSubmit={handleOnboardingSubmit}
          isLoading={isSubmittingOnboarding}
          error={onboardingError}
        />
      )}

      {/* Active Agent Card (when agent exists) */}
      {!loading && !error && agent && (
        <AgentCard
          agent={agent}
          initialApiKey={initialApiKey}
          accessToken={accessToken}
          onKeyRotated={(newKey) => setInitialApiKey(newKey)}
        />
      )}
    </div>
  );
};
