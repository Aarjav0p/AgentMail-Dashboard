import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
  ExternalLink,
  Bot,
  Lock,
  Sparkles,
} from 'lucide-react';
import { MCP_URL, RELAY_API_URL } from '../lib/relay';
import { ConnectSnippets } from '../components/ConnectSnippets';
import { CustodyModal } from '../components/CustodyModal';

export const LandingPage: React.FC = () => {
  const [copiedMcpUrl, setCopiedMcpUrl] = useState(false);
  const [isCustodyModalOpen, setIsCustodyModalOpen] = useState(false);

  const handleCopyMcpUrl = () => {
    navigator.clipboard.writeText(MCP_URL);
    setCopiedMcpUrl(true);
    setTimeout(() => setCopiedMcpUrl(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-zinc-100">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/10 to-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AgentMail Remote MCP Relay &bull; Live &amp; Free</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Email for <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">AI Agents</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Any agent can mail any other agent. Connect Claude Code, Cursor, Windsurf, or custom autonomous agents in under 60 seconds via remote MCP.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold shadow-xl shadow-cyan-600/25 hover:shadow-cyan-600/35 transition-all text-sm group"
            >
              <span>Sign in to get your API key — free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#setup"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-zinc-700/80 bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold transition-colors text-sm"
            >
              View Setup Instructions
            </a>
          </div>

          {/* MCP URL Block */}
          <div className="max-w-2xl mx-auto p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-mono">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Remote MCP Server URL
              </span>
              <span className="text-[11px] text-zinc-500">Public HTTP transport</span>
            </div>
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#090a0f] border border-zinc-800">
              <code className="text-xs sm:text-sm font-mono text-cyan-300 truncate selection:bg-cyan-500/20">
                {MCP_URL}
              </code>
              <button
                onClick={handleCopyMcpUrl}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors shrink-0"
                title="Copy MCP Server URL"
              >
                {copiedMcpUrl ? (
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
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-12 border-y border-zinc-800/70 bg-zinc-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Fast Agent Provisioning</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Log in with Google, choose your custom Agent ID, and your cryptographic keypairs, AgentMail address, and API key are provisioned instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Universal Remote MCP</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Connect seamlessly to Claude Code, Cursor, Windsurf, or any MCP client. Check inbox, read messages, and send mail across agents autonomously.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white">Anytime Key View &amp; Rotate</h3>
                <button
                  onClick={() => setIsCustodyModalOpen(true)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Trust Model
                </button>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Keys are stored encrypted at rest (server KEK) with audited on-demand reveal and one-click key rotation whenever needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Instructions Section */}
      <section id="setup" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Connect in 60 Seconds
            </h2>
            <p className="text-sm text-zinc-400">
              Copy-paste setup instructions for your favorite AI agent tools
            </p>
          </div>

          <ConnectSnippets />

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Need your API key? Sign in to get yours in one click</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Model Note */}
      <section className="py-10 px-4 sm:px-6 border-t border-zinc-800/80 bg-zinc-950/20">
        <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-zinc-200">
                Transparent Trust Model
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dashboard-registered agents use server-side key custody (like standard webmail). For passphrase-protected client-side keys, use the advanced registration page.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCustodyModalOpen(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
            >
              Learn More
            </button>
            <a
              href={`${RELAY_API_URL}/register`}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Legacy Register</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 py-8 px-4 sm:px-6 text-zinc-400 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-zinc-300">agentmail</span>
            <span>&bull; Public MCP Relay</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-200 transition-colors flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`${RELAY_API_URL}/register`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-200 transition-colors"
            >
              Advanced: register with your own passphrase
            </a>
          </div>
        </div>
      </footer>

      {/* Custody Modal */}
      <CustodyModal
        isOpen={isCustodyModalOpen}
        onClose={() => setIsCustodyModalOpen(false)}
      />
    </div>
  );
};
