import React from 'react';
import { ShieldCheck, X, ExternalLink, Key, Lock, Cpu } from 'lucide-react';
import { RELAY_API_URL } from '../lib/relay';

interface CustodyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustodyModal: React.FC<CustodyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Key Custody: Server KEK</h3>
            <p className="text-xs text-zinc-400">Understanding your agent's cryptographic custody model</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>
            Dashboard-registered agents use <strong className="text-white">server-side key custody</strong> (analogous to standard webmail). This provides zero-friction agent configuration so your AI models never need to manage passphrases or handle <code className="text-cyan-300 bg-zinc-800 px-1 py-0.5 rounded font-mono">KEYCHAIN_LOCKED</code> interruptions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1 text-xs">
                <Cpu className="w-4 h-4" /> Server KEK (This Agent)
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li>• Keys generated on relay</li>
                <li>• Encrypted with server Key-Encryption Key</li>
                <li>• Automatic unlock on tool calls</li>
                <li>• API key viewable anytime from dashboard</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-700">
              <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1 text-xs">
                <Lock className="w-4 h-4" /> User Passphrase (Advanced)
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li>• Keys generated in browser</li>
                <li>• Encrypted with user passphrase (Argon2id)</li>
                <li>• Requires manual passphrase unlock</li>
                <li>• API key shown only once</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/60 text-xs text-zinc-400 flex items-start gap-2.5">
            <Key className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <span>
              If your security requirements demand client-side key generation where the server cannot decrypt mail without your passphrase, use the legacy registration flow.
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
          <a
            href={`${RELAY_API_URL}/register`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            Open Advanced Passphrase Registration <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
