import { render } from '@testing-library/react';
import React from 'react';
import { test, vi } from 'vitest';
import App from './App';

vi.mock('./gameSource', () => ({
  fetchStart: vi.fn(() => new Promise(() => undefined)),
  fetchOpponents: vi.fn(() => new Promise(() => undefined)),
  sendMove: vi.fn(),
}));

test('renders learn react link', () => {
  render(<App />);
  // const linkElement = screen.getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});
