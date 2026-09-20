import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import App from './App';
import { localOpponents } from './engine/local';
import { fetchOpponents } from './gameSource';

vi.mock('./gameSource', () => ({
  fetchStart: vi.fn(() => new Promise(() => undefined)),
  fetchOpponents: vi.fn(() => new Promise(() => undefined)),
  sendMove: vi.fn(),
}));

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  vi.mocked(fetchOpponents).mockImplementation(() => new Promise(() => undefined));
});

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

test('applies shared controller presets and keeps changed controls shareable', async () => {
  window.history.replaceState({}, '', '/?both=jev&tiger=human');
  vi.mocked(fetchOpponents).mockResolvedValue(localOpponents());

  render(<App />);

  await waitFor(() => {
    expect(screen.getByLabelText(/^Goat:/)).toHaveValue('jev');
    expect(screen.getByLabelText(/^Tiger:/)).toHaveValue('human');
  });

  fireEvent.change(screen.getByLabelText(/^Tiger:/), {
    target: { value: 'jev' },
  });
  expect(window.location.search).toBe('?both=jev');
});

test('applies named strategy and Negamax depth presets', async () => {
  window.history.replaceState({}, '', '/?goat=goat-safe-edge&tiger=ai-3');
  vi.mocked(fetchOpponents).mockResolvedValue(localOpponents());

  render(<App />);

  await waitFor(() => {
    expect(screen.getByLabelText(/^Goat:/)).toHaveValue('goat-safe-edge');
    expect(screen.getByLabelText(/^Tiger:/)).toHaveValue('ai');
    expect(screen.getByLabelText('Tiger AI depth')).toHaveValue('3');
  });
});

test('ignores invalid controller presets', async () => {
  window.history.replaceState({}, '', '/?goat=nope&tiger=ai-99');
  vi.mocked(fetchOpponents).mockResolvedValue(localOpponents());

  render(<App />);

  await waitFor(() => {
    expect(screen.getByLabelText(/^Goat:/)).toHaveValue('human');
    expect(screen.getByLabelText(/^Tiger:/)).toHaveValue('ai');
    expect(screen.getByLabelText('Tiger AI depth')).toHaveValue('6');
  });
});
