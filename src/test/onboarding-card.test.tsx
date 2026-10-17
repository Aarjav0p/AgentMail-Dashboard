import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingCard } from '../components/OnboardingCard';

describe('OnboardingCard Component', () => {
  it('renders input and non-editable @agentmail suffix', () => {
    const handleSubmit = vi.fn();
    render(<OnboardingCard onSubmit={handleSubmit} isLoading={false} />);

    expect(screen.getByText('Create Your Agent ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('myagent42')).toBeInTheDocument();
    expect(screen.getByTestId('agentmail-suffix')).toHaveTextContent('@agentmail');
  });

  it('filters out spaces and non-alphanumeric characters from input', () => {
    const handleSubmit = vi.fn();
    render(<OnboardingCard onSubmit={handleSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('myagent42') as HTMLInputElement;

    // Type string with spaces, punctuation and special symbols: "my agent #42!"
    fireEvent.change(input, { target: { value: 'my agent #42!' } });

    // Should only keep alphabets and numbers without spaces
    expect(input.value).toBe('myagent42');
    expect(screen.getByText('myagent42@agentmail')).toBeInTheDocument();
  });

  it('submits sanitized handle when valid', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<OnboardingCard onSubmit={handleSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('myagent42');
    fireEvent.change(input, { target: { value: 'Claude42' } });

    const submitBtn = screen.getByRole('button', { name: /Complete Setup/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith('claude42');
    });
  });

  it('disables submit button when input is shorter than 3 characters', () => {
    const handleSubmit = vi.fn();
    render(<OnboardingCard onSubmit={handleSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('myagent42');
    fireEvent.change(input, { target: { value: 'ab' } });

    const submitBtn = screen.getByRole('button', { name: /Complete Setup/i });
    expect(submitBtn).toBeDisabled();
  });
});
