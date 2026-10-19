import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, LogOut, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export const Navbar: React.FC = () => {
  const { user, signOut, isDemoMode, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b border-zinc-800/80 bg-[#0d0f17]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                agentmail
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700/60 font-medium">
                MCP
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-zinc-400">
            <Link to="/" className="hover:text-zinc-100 transition-colors">
              Overview
            </Link>
            {user && (
              <Link to="/app" className="hover:text-cyan-400 text-zinc-300 transition-colors">
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* User state / CTAs */}
        <div className="flex items-center gap-3">
          {isDemoMode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3 h-3" /> Demo Mode
            </span>
          )}

          {!isConfigured && !isDemoMode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
              <ShieldAlert className="w-3 h-3" /> Setup Needed
            </span>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 font-mono hidden sm:inline max-w-[180px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700/80 hover:border-zinc-600 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-all hover:shadow-cyan-600/30"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
