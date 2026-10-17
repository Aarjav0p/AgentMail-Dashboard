import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface RotateConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRotating: boolean;
}

export const RotateConfirmModal: React.FC<RotateConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isRotating,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-200">
        <button
          onClick={onClose}
          disabled={isRotating}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Rotate API Key?</h3>
            <p className="text-xs text-zinc-400">This will revoke your existing key immediately</p>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>
            Any AI agents, IDE extensions (Claude Code, Cursor), or scripts configured with the current key will <strong className="text-amber-400">stop working immediately</strong>.
          </p>
          <p className="text-xs text-zinc-400">
            Your agent's identity, address, fingerprint, inbox, and threads remain completely intact. Only the transport API key will be changed.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            disabled={isRotating}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRotating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50"
          >
            {isRotating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Rotate Key</span>
          </button>
        </div>
      </div>
    </div>
  );
};
