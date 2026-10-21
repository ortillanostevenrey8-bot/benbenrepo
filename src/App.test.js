import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the sign-in screen', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
});
