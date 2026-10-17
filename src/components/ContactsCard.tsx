import React, { useState, useEffect, useRef } from 'react';
import {
  BookUser,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import type { UserContact, CreateContactPayload, UpdateContactPayload } from '../types';
import {
  createAccountContact,
  updateAccountContact,
  deleteAccountContact,
  checkHandleAvailability,
  RelayApiError,
  getFriendlyErrorMessage,
} from '../lib/relay';

interface ContactsCardProps {
  contacts: UserContact[];
  accessToken: string;
  onContactsUpdated: (updatedList: UserContact[]) => void;
  error?: string | null;
  onRetry?: () => void;
  isDemoMode?: boolean;
}

// Regex validation rules per PRD §6.7
const ALIAS_REGEX = /^[a-z0-9][a-z0-9_-]{1,31}$/;
const TARGET_REGEX = /^[a-z0-9][a-z0-9-]{2,31}$/;

export const ContactsCard: React.FC<ContactsCardProps> = ({
  contacts,
  accessToken,
  onContactsUpdated,
  error,
  onRetry,
  isDemoMode,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<UserContact | null>(null);

  // Form fields
  const [alias, setAlias] = useState('');
  const [targetHandle, setTargetHandle] = useState('');
  const [note, setNote] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [targetCheck, setTargetCheck] = useState<'idle' | 'checking' | 'reserved' | 'error'>('idle');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete modal state
  const [contactToDelete, setContactToDelete] = useState<UserContact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAliasValid = ALIAS_REGEX.test(alias);
  const isTargetValid = TARGET_REGEX.test(targetHandle);
  const isFormValid = isAliasValid && isTargetValid && note.length <= 200 && targetCheck !== 'reserved';

  const handleOpenAddForm = () => {
    setEditingContact(null);
    setAlias('');
    setTargetHandle('');
    setNote('');
    setFormError(null);
    setTargetCheck('idle');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (contact: UserContact) => {
    setEditingContact(contact);
    setAlias(contact.alias);
    setTargetHandle(contact.target_handle);
    setNote(contact.note || '');
    setFormError(null);
    setTargetCheck('idle');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
    setFormError(null);
    setTargetCheck('idle');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  // Debounced live availability check for target handle (DASH-02 §3)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!isFormOpen) {
      return;
    }

    // Skip entirely when editing a contact whose target is unchanged (DASH-02 §3)
    if (editingContact && targetHandle === editingContact.target_handle) {
      return;
    }

    if (!TARGET_REGEX.test(targetHandle)) {
      return;
    }

    let isCancelled = false;

    debounceTimerRef.current = setTimeout(async () => {
      setTargetCheck('checking');

      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 150));
        if (isCancelled) return;
        const DEMO_RESERVED = new Set(['admin', 'postmaster']); // demo theater only — NOT the real list
        if (DEMO_RESERVED.has(targetHandle)) {
          setTargetCheck('reserved');
        } else {
          setTargetCheck('idle');
        }
        return;
      }

      try {
        const result = await checkHandleAvailability(accessToken, targetHandle);
        if (isCancelled) return;
        if (result.reason === 'reserved') {
          setTargetCheck('reserved');
        } else {
          setTargetCheck('idle');
        }
      } catch {
        if (!isCancelled) {
          setTargetCheck('error');
        }
      }
    }, 400);

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [targetHandle, editingContact, isFormOpen, accessToken, isDemoMode]);

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-lowercase; strip @agentmail or @; keep characters in [a-z0-9_-]
    const cleaned = e.target.value
      .toLowerCase()
      .replace(/@agentmail/g, '')
      .replace(/@/g, '')
      .replace(/[^a-z0-9_-]/g, '');
    setAlias(cleaned);
    setFormError(null);
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-lowercase; strip @agentmail or @; keep characters in [a-z0-9-]
    const cleaned = e.target.value
      .toLowerCase()
      .replace(/@agentmail/g, '')
      .replace(/@/g, '')
      .replace(/[^a-z0-9-]/g, '');
    setTargetHandle(cleaned);
    setFormError(null);
    setTargetCheck('idle');
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    const payload: CreateContactPayload | UpdateContactPayload = {
      alias: alias.trim(),
      target_handle: targetHandle.trim(),
      note: note.trim() || null,
    };

    if (isDemoMode) {
      if (editingContact) {
        // Edit in demo mode
        const updated = contacts.map((c) =>
          c.id === editingContact.id
            ? {
                ...c,
                alias: payload.alias || c.alias,
                target_handle: payload.target_handle || c.target_handle,
                address: `${payload.target_handle || c.target_handle}@agentmail`,
                note: payload.note !== undefined ? payload.note : c.note,
                updated_at: new Date().toISOString(),
              }
            : c
        );
        onContactsUpdated(updated);
      } else {
        // Check duplicate in demo mode
        if (contacts.some((c) => c.alias === payload.alias)) {
          setFormError(`You already use '${payload.alias}' for ${targetHandle}@agentmail — edit that contact instead.`);
          setIsSubmitting(false);
          return;
        }
        const newContact: UserContact = {
          id: `contact-${Date.now()}`,
          alias: payload.alias!,
          target_handle: payload.target_handle!,
          address: `${payload.target_handle}@agentmail`,
          note: payload.note,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const nextList = [...contacts, newContact].sort((a, b) => a.alias.localeCompare(b.alias));
        onContactsUpdated(nextList);
      }
      setIsSubmitting(false);
      handleCloseForm();
      return;
    }

    try {
      if (editingContact) {
        const saved = await updateAccountContact(accessToken, editingContact.id, payload);
        const updatedList = contacts
          .map((c) => (c.id === saved.id ? saved : c))
          .sort((a, b) => a.alias.localeCompare(b.alias));
        onContactsUpdated(updatedList);
      } else {
        const created = await createAccountContact(accessToken, payload as CreateContactPayload);
        const nextList = [...contacts, created].sort((a, b) => a.alias.localeCompare(b.alias));
        onContactsUpdated(nextList);
      }
      handleCloseForm();
    } catch (err: unknown) {
      if (err instanceof RelayApiError && (err.code === 'ALIAS_EXISTS' || err.code === 'alias_exists')) {
        const existing = contacts.find((c) => c.alias === alias);
        const targetDesc = existing ? `${existing.target_handle}@agentmail` : 'another contact';
        setFormError(`You already use '${alias}' for ${targetDesc} — edit that contact instead.`);
      } else {
        setFormError(getFriendlyErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete || isDeleting) return;

    setIsDeleting(true);

    if (isDemoMode) {
      const nextList = contacts.filter((c) => c.id !== contactToDelete.id);
      onContactsUpdated(nextList);
      setIsDeleting(false);
      setContactToDelete(null);
      return;
    }

    try {
      await deleteAccountContact(accessToken, contactToDelete.id);
      const nextList = contacts.filter((c) => c.id !== contactToDelete.id);
      onContactsUpdated(nextList);
      setContactToDelete(null);
    } catch (err) {
      console.error('Failed to delete contact:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isAtCap = contacts.length >= 100;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookUser className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Contact Aliases
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {contacts.length}/100
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Name the addresses you mail often, then just tell your agent <em className="text-cyan-300">mail dad</em>.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={handleOpenAddForm}
            disabled={isAtCap}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-start sm:self-auto"
            title={isAtCap ? 'Maximum limit of 100 contacts reached' : 'Add new contact'}
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        )}
      </div>

      {/* Resilience Error state (PRD §7.1: contacts failure surfaces retry without breaking dashboard) */}
      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Cap Warning */}
      {isAtCap && !isFormOpen && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>Address book limit reached (100 contacts maximum).</span>
        </div>
      )}

      {/* Add / Edit Form Modal or Inline Panel */}
      {isFormOpen && (
        <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-zinc-700/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>{editingContact ? 'Edit Contact Alias' : 'Add Contact Alias'}</span>
            </h3>
            <button
              onClick={handleCloseForm}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveContact} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alias Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Alias (Short Name)
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={handleAliasChange}
                  placeholder="e.g. dad"
                  maxLength={32}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-cyan-500 focus:outline-none font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Letters, numbers, hyphen, underscore (2–32 chars)
                </span>
              </div>

              {/* Target Handle Field with split @agentmail addon */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Target Address
                </label>
                <div className="flex items-stretch rounded-xl border border-zinc-700 bg-zinc-900 focus-within:border-cyan-500 overflow-hidden">
                  <input
                    type="text"
                    value={targetHandle}
                    onChange={handleTargetChange}
                    placeholder="dadagent"
                    maxLength={32}
                    required
                    className="flex-1 bg-transparent px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                  />
                  <span
                    data-testid="contact-agentmail-suffix"
                    className="flex items-center px-3 bg-zinc-800 text-cyan-400 font-mono text-xs font-semibold select-none border-l border-zinc-700"
                  >
                    @agentmail
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Letters, numbers, hyphens (3–32 chars)</span>
                  {targetCheck === 'checking' && (
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                      <span>Checking...</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Note Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Note <span className="text-zinc-400 font-normal">(optional, &le; 200 chars)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                placeholder="Dad's coding assistant"
                maxLength={200}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-cyan-500 focus:outline-none text-xs text-zinc-200 placeholder:text-zinc-600"
              />
            </div>

            {/* Live Preview */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs flex items-center justify-between">
              <span className="text-zinc-400">Preview:</span>
              <span className="font-mono text-cyan-300 font-semibold">
                {alias || 'alias'} &rarr; {targetHandle || 'target'}@agentmail
              </span>
            </div>

            {/* Inline Error Message */}
            {(formError || targetCheck === 'reserved') && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  {targetCheck === 'reserved'
                    ? `'${targetHandle}' is a reserved handle and cannot receive mail.`
                    : formError}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{editingContact ? 'Update Contact' : 'Save Contact'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      <div className="mt-6">
        {contacts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-center">
            <BookUser className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-zinc-300 font-medium">
              No contacts yet — add <code className="text-cyan-400 bg-zinc-800 px-1 py-0.5 rounded font-mono">dad &rarr; dadagent@agentmail</code> and just say "mail dad".
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/40">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-mono">
                      {contact.alias}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-mono text-xs sm:text-sm text-cyan-300 font-medium">
                      {contact.address}
                    </span>
                    <button
                      onClick={() => handleCopy(contact.address, contact.id)}
                      className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                      title="Copy address"
                    >
                      {copiedId === contact.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {contact.note && (
                    <div className="text-xs text-zinc-400 mt-1">
                      {contact.note}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleOpenEditForm(contact)}
                    className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors cursor-pointer"
                    title="Edit contact"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setContactToDelete(contact)}
                    className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                    title="Delete contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-200">
            <h3 className="text-base font-bold text-white mb-2">Delete Contact Alias?</h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
              Your agent will no longer understand <strong className="text-cyan-400 font-mono">'{contactToDelete.alias}'</strong>.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setContactToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
