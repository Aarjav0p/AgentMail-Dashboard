import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export const LoginPage: React.FC = () => {
  const { user, signInWithOtp, signInWithGoogle, isConfigured, enableDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/app';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    setErrorMessage(null);

    const { error } = await signInWithOtp(email.trim());

    if (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to send magic link. Please try again.');
    } else {
      setStatus('sent');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message || 'Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              agentmail
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Zero forms — your agent identity and API key are provisioned automatically on first sign-in.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Status Alert for Sent Link */}
          {status === 'sent' ? (
            <div className="p-5 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">Magic Link Sent!</h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                We sent a sign-in link to <strong className="text-cyan-300 font-mono">{email}</strong>.
                Click the link in your email to sign in directly.
              </p>
              <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-800">
                Didn't receive it? Check spam or{' '}
                <button
                  onClick={() => setStatus('idle')}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  try another email
                </button>
                .
              </div>
            </div>
          ) : (
            <>
              {/* Google OAuth Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || status === 'sending'}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-700/80 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 hover:text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-900 px-3 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold absolute">
                  or magic link
                </span>
              </div>

              {/* Email Magic Link Form */}
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-zinc-300 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent-owner@example.com"
                    required
                    disabled={status === 'sending'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending' || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Magic Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <div className="font-semibold">Sign in error</div>
                    <div>{errorMessage}</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Demo Mode / Dev Helper */}
          {(!isConfigured || status === 'error') && (
            <div className="pt-4 border-t border-zinc-800/80">
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-zinc-300">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Local Demo Mode Available
                </div>
                <p className="text-[11px] text-zinc-400 mb-2">
                  Want to explore the dashboard immediately without configuring live Supabase Auth?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    enableDemoMode();
                    navigate('/app');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 font-semibold text-xs transition-colors"
                >
                  Launch Dashboard in Demo Mode
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            &larr; Back to home page
          </Link>
        </div>
      </div>
    </div>
  );
};
