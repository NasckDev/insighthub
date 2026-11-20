import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataError } from '../data';
import { ErrorState } from './states';

describe('ErrorState', () => {
  it('offers "Informar token" instead of a blind retry hint when the API wants a token', () => {
    render(<ErrorState error={new DataError('A API exige um token.', 'AUTH')} onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('A API exige um token.');
    expect(screen.getByRole('button', { name: 'Informar token' })).toBeInTheDocument();
    expect(screen.queryByText(/volte em instantes/)).not.toBeInTheDocument();
  });

  it('keeps the plain retry for other failures', () => {
    render(<ErrorState error={new DataError('Falha.', 'SERVER')} onRetry={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Informar token' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
