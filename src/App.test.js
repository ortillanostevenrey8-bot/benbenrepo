import { render, screen } from '@testing-library/react';
import App from './App';

test('shows the account loading state while authentication is checked', () => {
  render(<App />);
  expect(screen.getByText(/loading your account/i)).toBeInTheDocument();
});
