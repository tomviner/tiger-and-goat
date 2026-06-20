import { render } from '@testing-library/react';
import React from 'react';
import { test, vi } from 'vitest';
import App from './App';

vi.mock('./api', () => ({
  getData: vi.fn(() => new Promise(() => undefined)),
  getOpponents: vi.fn(() => new Promise(() => undefined)),
  postData: vi.fn(),
}));

test('renders learn react link', () => {
  render(<App />);
  // const linkElement = screen.getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});
