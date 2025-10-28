import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';

import App from './app';

// Mock AWS Amplify
vi.mock('@aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    username: 'test-user',
    attributes: {
      email: 'test@example.com',
    },
  }),
}));

describe('App', () => {
  it('should render successfully', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { baseElement } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(baseElement).toBeTruthy();
  });
});
