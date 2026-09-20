import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { expect, test, vi } from 'vitest';
import App from './App';

vi.mock('./gameSource', () => ({
  fetchStart: vi.fn(() => new Promise(() => undefined)),
  fetchOpponents: vi.fn(() => new Promise(() => undefined)),
  sendMove: vi.fn(),
}));

test('offers Jev for both goats and tigers', () => {
  render(<App />);
  expect(screen.getAllByRole('option', { name: 'Jev (Cloudflare)' })).toHaveLength(2);

  expect(screen.getByText('Rules engine:')).toBeInTheDocument();
  expect(
    screen.getByRole('option', { name: 'Browser (game rules)' }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/^Goat:/), {
    target: { value: 'jev' },
  });
  expect(screen.getByText('Jev AI:')).toBeInTheDocument();
  expect(screen.getByText('Cloudflare')).toBeInTheDocument();
});
