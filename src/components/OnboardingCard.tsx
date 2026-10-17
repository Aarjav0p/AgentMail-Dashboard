import React, { useState } from 'react';
import { Bot, ArrowRight, Loader2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface OnboardingCardProps {
  onSubmit: (handle: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  onSubmit,
  isLoading,
  error,
}) => {
  const [handle, setHandle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strictly allow only alphabets and numbers, remove all spaces and special characters
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    setHandle(sanitized);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = handle.trim();

    if (!clean) {
      setValidationError('Please enter an Agent ID.');
      return;
    }

    if (clean.length < 3) {
      setValidationError('Agent ID must be at least 3 characters long.');
      return;
    }

    if (clean.length > 32) {
      setValidationError('Agent ID cannot exceed 32 characters.');
      return;
    }

    await onSubmit(clean.toLowerCase());
  };

  const fullAgentId = handle ? `${handle.toLowerCase()}@agentmail` : '';

  return (
    <div className="max-w-xl mx-auto">
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
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Create Your Agent ID
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
          Set up a unique address for your AI agent mailbox. Only alphabets and numbers are permitted (no spaces or special characters).
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="agent-id-input"
              className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
            >
              Choose Agent ID
            </label>

            {/* Input with appended non-editable @agentmail text block */}
            <div className="flex items-stretch rounded-xl border border-zinc-700 bg-zinc-950 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all overflow-hidden">
              <input
                id="agent-id-input"
                type="text"
                value={handle}
                onChange={handleInputChange}
                placeholder="myagent42"
                disabled={isLoading}
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

            {/* Helper notes */}
            <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Alphabets and numbers only &bull; No spaces</span>
              <span>3–32 characters</span>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Complete Agent ID Preview
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-bold text-cyan-300 truncate">
                {fullAgentId || 'yourname@agentmail'}
              </span>
              {handle.length >= 3 && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </div>
          </div>

          {/* Validation or API error */}
          {(validationError || error) && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>{validationError || error}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || handle.length < 3}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm shadow-xl shadow-cyan-600/25 hover:shadow-cyan-600/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
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
        </form>
      </div>
    </div>
  );
};
