import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactsCard } from '../components/ContactsCard';
import * as RelayModule from '../lib/relay';
import type { UserContact } from '../types';

describe('ContactsCard (PRD §6.7 & §10)', () => {
  const sampleContacts: UserContact[] = [
    {
      id: 'contact-1',
      alias: 'dad',
      target_handle: 'dadagent',
      address: 'dadagent@agentmail',
      note: "Dad's assistant",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'contact-2',
      alias: 'mom',
      target_handle: 'momagent',
      address: 'momagent@agentmail',
      note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('renders contacts list and shows the empty state when list is empty', () => {
    const onUpdated = vi.fn();
    const { rerender } = render(
      <ContactsCard
        contacts={[]}
        accessToken="mock-token"
        onContactsUpdated={onUpdated}
      />
    );

    expect(
      screen.getByText(/No contacts yet — add/i)
    ).toBeInTheDocument();

    rerender(
      <ContactsCard
        contacts={sampleContacts}
        accessToken="mock-token"
        onContactsUpdated={onUpdated}
      />
    );

    expect(screen.getByText('dad')).toBeInTheDocument();
    expect(screen.getByText('dadagent@agentmail')).toBeInTheDocument();
    expect(screen.getByText("Dad's assistant")).toBeInTheDocument();
    expect(screen.getByText('mom')).toBeInTheDocument();
  });

  it('has split-input target field with non-editable @agentmail addon and adds contact successfully', async () => {
    const onUpdated = vi.fn();
    const createSpy = vi.spyOn(RelayModule, 'createAccountContact').mockResolvedValue({
      id: 'contact-3',
      alias: 'alice',
      target_handle: 'alice-bot',
      address: 'alice-bot@agentmail',
      note: 'Team bot',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    render(
      <ContactsCard
        contacts={sampleContacts}
        accessToken="mock-token"
        onContactsUpdated={onUpdated}
      />
    );

    // Open Add Form
    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));

    // Check fixed @agentmail addon exists
    const suffix = screen.getByTestId('contact-agentmail-suffix');
    expect(suffix).toBeInTheDocument();
    expect(suffix).toHaveTextContent('@agentmail');

    // Inputs: alias and target
    const aliasInput = screen.getByPlaceholderText(/e\.g\. dad/i);
    const targetInput = screen.getByPlaceholderText('dadagent');
    const noteInput = screen.getByPlaceholderText("Dad's coding assistant");

    // Test that @ is stripped / blocked
    fireEvent.change(aliasInput, { target: { value: 'Alice@123' } });
    expect(aliasInput).toHaveValue('alice123'); // auto-lowercased, @ removed

    fireEvent.change(aliasInput, { target: { value: 'alice' } });
    fireEvent.change(targetInput, { target: { value: 'alice-bot@agentmail' } });
    expect(targetInput).toHaveValue('alice-bot'); // auto-lowercased, @ and forbidden stripped

    fireEvent.change(noteInput, { target: { value: 'Team bot' } });

    // Submit
    const saveBtn = screen.getByRole('button', { name: /save contact/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith('mock-token', {
        alias: 'alice',
        target_handle: 'alice-bot',
        note: 'Team bot',
      });
    });

    expect(onUpdated).toHaveBeenCalled();
  });

  it('handles inline ALIAS_EXISTS error per PRD §6.7 & §7.1', async () => {
    const onUpdated = vi.fn();
    vi.spyOn(RelayModule, 'createAccountContact').mockRejectedValue(
      new RelayModule.RelayApiError("You already have a contact named 'dad'.", 'ALIAS_EXISTS', 409)
    );

    render(
      <ContactsCard
        contacts={sampleContacts}
        accessToken="mock-token"
        onContactsUpdated={onUpdated}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));

    const aliasInput = screen.getByPlaceholderText(/e\.g\. dad/i);
    const targetInput = screen.getByPlaceholderText('dadagent');

    fireEvent.change(aliasInput, { target: { value: 'dad' } });
    fireEvent.change(targetInput, { target: { value: 'newdad' } });

    fireEvent.click(screen.getByRole('button', { name: /save contact/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/You already use 'dad' for dadagent@agentmail — edit that contact instead\./i)
      ).toBeInTheDocument();
    });
  });

  it('confirms and executes delete contact', async () => {
    const onUpdated = vi.fn();
    const deleteSpy = vi.spyOn(RelayModule, 'deleteAccountContact').mockResolvedValue();

    render(
      <ContactsCard
        contacts={sampleContacts}
        accessToken="mock-token"
        onContactsUpdated={onUpdated}
      />
    );

    // Click delete on first contact ('dad')
    const deleteButtons = screen.getAllByTitle('Delete contact');
    fireEvent.click(deleteButtons[0]);

    // Modal appears with exact PRD text
    expect(screen.getByText(/Delete Contact Alias\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your agent will no longer understand/i)
    ).toBeInTheDocument();
    expect(screen.getByText("'dad'")).toBeInTheDocument();

    // Confirm Delete
    const confirmBtn = screen.getByRole('button', { name: /^Delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('mock-token', 'contact-1');
    });

    expect(onUpdated).toHaveBeenCalledWith([sampleContacts[1]]);
  });

  it('disables add button and shows warning at 100 contacts cap', () => {
    const hundredContacts: UserContact[] = Array.from({ length: 100 }, (_, i) => ({
      id: `c-${i}`,
      alias: `alias${i}`,
      target_handle: `target${i}`,
      address: `target${i}@agentmail`,
      note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    render(
      <ContactsCard
        contacts={hundredContacts}
        accessToken="mock-token"
        onContactsUpdated={vi.fn()}
      />
    );

    const addBtn = screen.getByRole('button', { name: /add contact/i });
    expect(addBtn).toBeDisabled();
    expect(screen.getByText('100/100')).toBeInTheDocument();
    expect(screen.getByText(/Address book limit reached \(100 contacts maximum\)\./i)).toBeInTheDocument();
  });

  it('displays resilience error banner with retry button without crashing', () => {
    const onRetry = vi.fn();

    render(
      <ContactsCard
        contacts={[]}
        accessToken="mock-token"
        onContactsUpdated={vi.fn()}
        error="Failed to load contacts. Relay connection timed out."
        onRetry={onRetry}
      />
    );

    expect(screen.getByText(/Failed to load contacts\. Relay connection timed out\./i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
